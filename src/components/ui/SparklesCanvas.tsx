import { useEffect, useRef } from 'react'

interface DiamondParticle {
  x: number
  y: number
  radius: number
  flareRatio: number
  baseAlpha: number
  currentAlpha: number
  twinkleSpeed: number
  twinklePhase: number
  vx: number
  vy: number
  color: string
  glow: number
  rotation: number
  rotSpeed: number
}

const GOLD_PALETTE = [
  'rgba(255, 223, 100, ', // bright radiant gold
  'rgba(240, 216, 120, ', // gold-300
  'rgba(232, 201, 109, ', // gold-400
  'rgba(255, 248, 220, ', // warm starlight diamond
  'rgba(255, 255, 255, ', // sparkling pure white glint
]

export default function SparklesCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = 0
    let height = 0
    let particles: DiamondParticle[] = []
    let mouseX = -1000
    let mouseY = -1000

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Responsive particle count: ~20 on mobile, ~48 on desktop
    const getParticleCount = () => {
      const isMobile = window.innerWidth < 768
      return isMobile ? 20 : 48
    }

    const initCanvasSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight

      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      ctx.scale(dpr, dpr)
    }

    // Diverse size hierarchy
    const createDiamond = (randomY = true): DiamondParticle => {
      const colorBase = GOLD_PALETTE[Math.floor(Math.random() * GOLD_PALETTE.length)]
      const baseAlpha = 0.35 + Math.random() * 0.55
      
      const rand = Math.random()
      let radius: number
      let glow: number
      let flareRatio: number

      if (rand < 0.35) {
        // Micro delicate diamond (35%)
        radius = 0.8 + Math.random() * 0.6 // 0.8 - 1.4px
        glow = 3 + Math.random() * 3
        flareRatio = 2.2
      } else if (rand < 0.75) {
        // Medium ambient diamond (40%)
        radius = 1.6 + Math.random() * 0.8 // 1.6 - 2.4px
        glow = 6 + Math.random() * 5
        flareRatio = 2.8
      } else if (rand < 0.93) {
        // Large radiant diamond (18%)
        radius = 2.6 + Math.random() * 0.8 // 2.6 - 3.4px
        glow = 10 + Math.random() * 7
        flareRatio = 3.2
      } else {
        // Majestic hero diamond flare (7%)
        radius = 3.6 + Math.random() * 1.2 // 3.6 - 4.8px
        glow = 15 + Math.random() * 10
        flareRatio = 3.8
      }

      // Find an uncluttered position (anti-clustering)
      let spawnX = Math.random() * width
      let spawnY = randomY ? Math.random() * height : height + 15
      
      if (particles.length > 0) {
        for (let attempt = 0; attempt < 8; attempt++) {
          const testX = Math.random() * width
          const testY = randomY ? Math.random() * height : height + 15
          let tooClose = false
          for (let i = 0; i < particles.length; i++) {
            const dx = testX - particles[i].x
            const dy = testY - particles[i].y
            if (dx * dx + dy * dy < 70 * 70) {
              tooClose = true
              break
            }
          }
          if (!tooClose) {
            spawnX = testX
            spawnY = testY
            break
          }
        }
      }

      return {
        x: spawnX,
        y: spawnY,
        radius,
        flareRatio,
        baseAlpha,
        currentAlpha: baseAlpha,
        twinkleSpeed: 0.01 + Math.random() * 0.015, // peaceful, subtle twinkle
        twinklePhase: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.06,
        vy: -(0.05 + Math.random() * 0.08), // gentle, slow dreamy float
        color: colorBase,
        glow,
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.003, // slow, graceful rotation
      }
    }

    const initParticles = () => {
      const count = getParticleCount()
      particles = []
      for (let i = 0; i < count; i++) {
        particles.push(createDiamond(true))
      }
      // Pre-warm so diamonds are actively twinkling across the screen immediately
      for (let step = 0; step < 8; step++) {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i]
          p.x += p.vx
          p.y += p.vy
          p.twinklePhase += p.twinkleSpeed
          p.currentAlpha = p.baseAlpha + Math.sin(p.twinklePhase) * 0.25
        }
      }
    }

    initCanvasSize()
    initParticles()

    const handleResize = () => {
      initCanvasSize()
      const count = getParticleCount()
      while (particles.length < count) particles.push(createDiamond(true))
      while (particles.length > count) particles.pop()
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth >= 768) {
        mouseX = e.clientX
        mouseY = e.clientY
      }
    }

    const handleMouseLeave = () => {
      mouseX = -1000
      mouseY = -1000
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mouseleave', handleMouseLeave)

    let isTabVisible = true
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden
      if (isTabVisible && !prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Render exclusively 4-point sparkling diamond stars
    const drawSparklingDiamond = (
      p: DiamondParticle,
      x: number,
      y: number,
      radius: number,
      alpha: number
    ) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(p.rotation)
      ctx.fillStyle = `${p.color}${alpha})`
      ctx.shadowBlur = p.glow
      ctx.shadowColor = `${p.color}1)`

      // Center bright diamond core
      ctx.beginPath()
      ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 2)
      ctx.fill()

      // 4-point diamond star flare rays
      const flareLen = radius * p.flareRatio * (0.7 + alpha * 0.55)
      const flareWidth = radius * 0.32

      // Vertical ray
      ctx.beginPath()
      ctx.moveTo(0, -flareLen)
      ctx.quadraticCurveTo(0, 0, flareWidth, 0)
      ctx.quadraticCurveTo(0, 0, 0, flareLen)
      ctx.quadraticCurveTo(0, 0, -flareWidth, 0)
      ctx.quadraticCurveTo(0, 0, 0, -flareLen)
      ctx.fill()

      // Horizontal ray
      ctx.beginPath()
      ctx.moveTo(-flareLen, 0)
      ctx.quadraticCurveTo(0, 0, 0, flareWidth)
      ctx.quadraticCurveTo(0, 0, flareLen, 0)
      ctx.quadraticCurveTo(0, 0, 0, -flareWidth)
      ctx.quadraticCurveTo(0, 0, -flareLen, 0)
      ctx.fill()

      ctx.restore()
    }

    const render = () => {
      if (!isTabVisible) return

      ctx.clearRect(0, 0, width, height)

      const isDesktop = width >= 768

      // 1. Anti-clustering mutual dispersion pass (prevents diamonds from ganging up)
      const minDist = 80
      const minDistSq = minDist * minDist
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i]
          const p2 = particles[j]
          const dx = p2.x - p1.x
          const dy = p2.y - p1.y
          const distSq = dx * dx + dy * dy
          if (distSq < minDistSq && distSq > 0.01) {
            const dist = Math.sqrt(distSq)
            const overlap = (minDist - dist) / minDist
            const pushX = (dx / dist) * overlap * 0.18
            const pushY = (dy / dist) * overlap * 0.18
            p1.x -= pushX
            p1.y -= pushY
            p2.x += pushX
            p2.y += pushY
          }
        }
      }

      // 2. Physics & Draw pass
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        if (!prefersReducedMotion) {
          // Ultra-smooth, peaceful floating drift
          p.x += p.vx + Math.sin(p.twinklePhase * 0.5) * 0.06
          p.y += p.vy
          p.rotation += p.rotSpeed

          // Twinkle pulse
          p.twinklePhase += p.twinkleSpeed
          p.currentAlpha = p.baseAlpha + Math.sin(p.twinklePhase) * 0.25
          p.currentAlpha = Math.max(0.12, Math.min(0.95, p.currentAlpha))

          // Subtle desktop mouse interaction
          if (isDesktop && mouseX > 0) {
            const dx = p.x - mouseX
            const dy = p.y - mouseY
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < 90 && dist > 0) {
              const force = (90 - dist) / 90
              p.x += (dx / dist) * force * 0.3
              p.y += (dy / dist) * force * 0.3
              p.currentAlpha = Math.min(1, p.currentAlpha + 0.2)
            }
          }

          // Screen loop
          if (p.y < -25) {
            p.y = height + 15
            p.x = Math.random() * width
          }
          if (p.x < -25) p.x = width + 15
          if (p.x > width + 25) p.x = -15
        }

        // Draw sparkling diamond
        drawSparklingDiamond(p, p.x, p.y, p.radius, p.currentAlpha)
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render)
      }
    }

    if (prefersReducedMotion) {
      render()
    } else {
      animationFrameId = requestAnimationFrame(render)
    }

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
    />
  )
}
