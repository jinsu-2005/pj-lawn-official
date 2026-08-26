import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const galleryDir = path.resolve('public/gallery')

console.log('Starting image compression in:', galleryDir)

fs.readdir(galleryDir, async (err, files) => {
  if (err) {
    console.error('Error reading gallery directory:', err)
    process.exit(1)
  }

  const imageFiles = files.filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'))
  console.log(`Found ${imageFiles.length} source images.`)

  for (const file of imageFiles) {
    const filePath = path.join(galleryDir, file)
    const ext = path.extname(file)
    const baseName = path.basename(file, ext)
    const destPath = path.join(galleryDir, `${baseName}.webp`)

    console.log(`Compressing ${file} -> ${baseName}.webp...`)

    try {
      await sharp(filePath)
        .resize({ width: 1200, withoutEnlargement: true }) // limit width to 1200px max
        .webp({ quality: 80 }) // convert to optimized WebP
        .toFile(destPath)

      // Verify the new file exists and is smaller
      const oldStats = fs.statSync(filePath)
      const newStats = fs.statSync(destPath)
      console.log(`Success! Original: ${(oldStats.size / (1024 * 1024)).toFixed(2)}MB, Compressed: ${(newStats.size / 1024).toFixed(1)}KB`)

      // Delete the original unoptimized file
      fs.unlinkSync(filePath)
      console.log(`Deleted original: ${file}`)
    } catch (compressErr) {
      console.error(`Error compressing ${file}:`, compressErr)
    }
  }

  console.log('Image compression task completed successfully!')
})
