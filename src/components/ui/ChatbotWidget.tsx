import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Bot, User } from 'lucide-react'

function parseInlineFormatting(text: string): React.ReactNode[] {
  const regex = /(\[.*?\]\(https?:\/\/[^\s)]+\)|\*\*.*?\*\*|https?:\/\/[^\s<]+|wa\.me\/[^\s<]+|(?:WhatsApp(?:\s+at|\s*:)?\s*(?:\+91[\s-]?)?0?[6-9]\d{4}[\s-]?\d{5})|(?:\+91[\s-]?)?0?[6-9]\d{4}[\s-]?\d{5})/gi;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (!part) return null;

    const mdLinkMatch = part.match(/^\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/);
    if (mdLinkMatch) {
      return (
        <a
          key={idx}
          href={mdLinkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold-400 hover:text-gold-300 underline font-medium inline-flex items-center gap-0.5"
        >
          {mdLinkMatch[1]}
        </a>
      );
    }

    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const inner = part.slice(2, -2).replace(/\*/g, '');
      return (
        <strong key={idx} className="font-semibold text-gold-400">
          {parseInlineFormatting(inner)}
        </strong>
      );
    }

    if (/^WhatsApp/i.test(part.trim())) {
      const digits = part.replace(/\D/g, '');
      const waNumber = digits.length === 10 ? `91${digits}` : digits.startsWith('0') ? `91${digits.slice(1)}` : digits;
      return (
        <a
          key={idx}
          href={`https://wa.me/${waNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 my-0.5 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 hover:text-emerald-300 font-medium text-xs transition-all shadow-sm"
        >
          💬 {part.trim()}
        </a>
      );
    }

    if (/^https?:\/\/[^\s<]+$/i.test(part)) {
      const isWhatsApp = part.includes('wa.me') || part.includes('whatsapp.com');
      return (
        <a
          key={idx}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={
            isWhatsApp
              ? "inline-flex items-center gap-1.5 px-2.5 py-0.5 my-0.5 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 hover:text-emerald-300 font-medium text-xs transition-all shadow-sm"
              : "text-gold-400 hover:text-gold-300 underline font-medium"
          }
        >
          {isWhatsApp ? '💬 WhatsApp' : part}
        </a>
      );
    }

    if (/^wa\.me\/[^\s<]+$/i.test(part)) {
      return (
        <a
          key={idx}
          href={`https://${part}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 my-0.5 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 hover:text-emerald-300 font-medium text-xs transition-all shadow-sm"
        >
          💬 WhatsApp
        </a>
      );
    }

    const trimmedPart = part.trim();
    if (/^(?:\+91[\s-]?)?0?[6-9]\d{4}[\s-]?\d{5}$/.test(trimmedPart)) {
      const cleanDigits = trimmedPart.replace(/\D/g, '');
      const phoneDigits = cleanDigits.length === 10 ? `+91${cleanDigits}` : cleanDigits.startsWith('91') ? `+${cleanDigits}` : cleanDigits.startsWith('0') ? `+91${cleanDigits.slice(1)}` : `+${cleanDigits}`;
      return (
        <a
          key={idx}
          href={`tel:${phoneDigits}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 my-0.5 rounded-md bg-gold-500/15 text-gold-400 border border-gold-500/30 hover:bg-gold-500/25 hover:text-gold-300 font-medium text-xs transition-all"
        >
          📞 {trimmedPart}
        </a>
      );
    }

    return part.replace(/\*/g, '');
  });
}

function renderMessageText(content: string) {
  const cleanContent = content
    .replace(/\r\n/g, '\n')
    .replace(/\*\*\*/g, '**');

  const lines = cleanContent.split('\n');

  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lineIdx} className="h-1.5" />;
        }

        const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ');
        const lineContent = isBullet ? trimmed.replace(/^(\*|-|•)\s+/, '') : line;

        const isHeader = /^#{1,3}\s+/.test(trimmed);
        const headerText = isHeader ? trimmed.replace(/^#{1,3}\s+/, '') : lineContent;

        const renderedLine = parseInlineFormatting(headerText);

        if (isHeader) {
          return (
            <p key={lineIdx} className="font-semibold text-gold-400 text-sm mt-2 mb-1">
              {renderedLine}
            </p>
          );
        }

        if (isBullet) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-1 my-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-400/70 mt-2 shrink-0"></span>
              <div className="flex-1">{renderedLine}</div>
            </div>
          );
        }

        return <p key={lineIdx}>{renderedLine}</p>;
      })}
    </div>
  );
}

const STARTER_QUESTIONS = [
  'Contact Info',
  'Venue Address',
  'Venue Pricing',
  'How booking works'
]

const PLACEHOLDER_PROMPTS = [
  'Ask about venue pricing...',
  'Ask about booking steps...',
  'Ask for contact & WhatsApp...',
  'Ask about lawn facilities...'
]

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: 'Hi there! I am the PJ Lawn AI assistant. How can I help you today?' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isOpen])

  useEffect(() => {
    if (!isOpen) return
    const timer = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % PLACEHOLDER_PROMPTS.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [isOpen])

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return

    const userMsg = textToSend.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setIsLoading(true)

    try {
      const response = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: messages.slice(1)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }])
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting to my servers right now.' }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleChipClick = (question: string) => {
    if (isLoading) return
    setInput('')
    inputRef.current?.focus()

    let currentIdx = 0
    const interval = setInterval(() => {
      currentIdx++
      setInput(question.slice(0, currentIdx))
      if (currentIdx >= question.length) {
        clearInterval(interval)
        setTimeout(() => {
          sendMessage(question)
        }, 160)
      }
    }, 20)
  }

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault()
    sendMessage(input)
  }

  return (
    <>
      {/* Floating Action Button — polished AI assistant style */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 group"
            aria-label="Open AI Assistant"
          >
            {/* Pulse ring */}
            <span
              className="absolute inset-0 rounded-full bg-gold-500/25 animate-chat-pulse"
              style={{ borderRadius: '50%' }}
            />
            {/* Main button */}
            <span
              className="relative flex w-14 h-14 rounded-full items-center justify-center shadow-2xl transition-shadow duration-300"
              style={{
                background: 'linear-gradient(135deg, #c9a84c 0%, #e8c96d 60%, #c9a84c 100%)',
                boxShadow: '0 8px 32px rgba(201,168,76,0.35), 0 2px 8px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.2) inset'
              }}
            >
              <Bot size={24} className="text-charcoal-900 drop-shadow-sm" />
            </span>
            {/* Tooltip label */}
            <span className="absolute right-16 top-1/2 -translate-y-1/2 bg-charcoal-800 border border-white/12 text-cream-100 text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-xl pointer-events-none">
              Ask AI
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chatwindow"
            initial={{ opacity: 0, y: 40, scale: 0.93 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.93 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="fixed bottom-24 right-4 left-4 sm:left-auto sm:w-[400px] sm:max-w-[400px] h-[500px] sm:h-[560px] flex flex-col z-[9991] overflow-hidden overscroll-contain sm:right-6 sm:bottom-6"
            style={{
              background: '#101010',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              boxShadow: '0 0 0 1px rgba(201,168,76,0.12), 0 24px 64px -12px rgba(0,0,0,0.85), 0 0 40px -8px rgba(201,168,76,0.12)'
            }}
          >
            {/* Header */}
            <div
              className="flex-shrink-0 flex justify-between items-center px-4 py-3.5"
              style={{
                background: '#161616',
                borderBottom: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <div className="flex items-center gap-3">
                {/* Bot avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #c9a84c 0%, #e8c96d 100%)',
                    boxShadow: '0 0 12px rgba(201,168,76,0.3)'
                  }}
                >
                  <Bot size={18} className="text-charcoal-900" />
                </div>
                <div>
                  <h3 className="text-cream-50 font-semibold text-sm leading-tight tracking-tight">PJ Lawn Assistant</h3>
                  <p className="text-[11px] text-gold-400/80 flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_4px_rgba(74,222,128,0.6)]" />
                    AI · Always available
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-cream-400 hover:text-cream-100 hover:bg-white/8 transition-all"
                aria-label="Close chat"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages Area */}
            <div
              className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar overscroll-contain"
              style={{ background: '#0d0d0d' }}
            >
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2.5 max-w-[88%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                    {/* Avatar */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                        msg.role === 'user'
                          ? 'bg-charcoal-700 border border-white/12'
                          : ''
                      }`}
                      style={msg.role === 'assistant' ? {
                        background: 'linear-gradient(135deg, #c9a84c, #e8c96d)',
                        boxShadow: '0 0 8px rgba(201,168,76,0.25)'
                      } : {}}
                    >
                      {msg.role === 'user'
                        ? <User size={11} className="text-cream-300" />
                        : <Bot size={11} className="text-charcoal-900" />
                      }
                    </div>

                    {/* Bubble */}
                    <div
                      className={`px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'text-cream-100 rounded-2xl rounded-tr-sm'
                          : 'text-cream-200 rounded-2xl rounded-tl-sm'
                      }`}
                      style={msg.role === 'user' ? {
                        background: '#1e1a10',
                        border: '1px solid rgba(201,168,76,0.2)',
                      } : {
                        background: '#191919',
                        border: '1px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      {renderMessageText(msg.content)}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2.5 max-w-[88%] flex-row">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                      style={{ background: 'linear-gradient(135deg, #c9a84c, #e8c96d)' }}
                    >
                      <Bot size={11} className="text-charcoal-900" />
                    </div>
                    <div
                      className="px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center"
                      style={{ background: '#191919', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      {[0, 150, 300].map((delay) => (
                        <div
                          key={delay}
                          className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{ backgroundColor: 'rgba(201,168,76,0.5)', animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Starter chips — only on first load */}
            {messages.length === 1 && !isLoading && (
              <div
                className="flex-shrink-0 px-3 py-2.5"
                style={{ background: '#131313', borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-[10px] uppercase tracking-widest text-gold-500/60 font-semibold mb-2 px-0.5">
                  Quick questions
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {STARTER_QUESTIONS.map((question, qIdx) => (
                    <button
                      key={qIdx}
                      type="button"
                      onClick={() => handleChipClick(question)}
                      className="px-3 py-2 rounded-xl text-cream-300 hover:text-gold-300 text-xs font-medium text-left transition-all duration-150 leading-tight active:scale-95 truncate"
                      style={{
                        background: '#1a1a1a',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(201,168,76,0.4)'
                        ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(201,168,76,0.08)'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'
                        ;(e.currentTarget as HTMLButtonElement).style.background = '#1a1a1a'
                      }}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input area */}
            <form
              onSubmit={handleSend}
              className="flex-shrink-0 flex gap-2 p-3"
              style={{ background: '#161616', borderTop: '1px solid rgba(255,255,255,0.08)' }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={PLACEHOLDER_PROMPTS[placeholderIdx]}
                className="flex-1 rounded-full px-4 py-2.5 text-sm text-cream-50 transition-all focus:outline-none"
                style={{
                  background: '#0d0d0d',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#faf6ec',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.07)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed active:scale-95"
                style={{
                  background: input.trim() && !isLoading
                    ? 'linear-gradient(135deg, #c9a84c, #e8c96d)'
                    : 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: input.trim() && !isLoading ? '0 4px 16px rgba(201,168,76,0.25)' : 'none',
                  color: input.trim() && !isLoading ? '#0a0a0a' : 'rgba(217,205,181,0.4)',
                }}
                aria-label="Send message"
              >
                <Send size={15} className="ml-0.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
