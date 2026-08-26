import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Bot, User } from 'lucide-react'

function parseInlineFormatting(text: string): React.ReactNode[] {
  // Regex to detect:
  // 1. Markdown links: [Title](url)
  // 2. Bold text: **text**
  // 3. URLs (http/https)
  // 4. WhatsApp links (wa.me) or WhatsApp + number phrase
  // 5. Phone numbers (+91 94897 24975, 094897 24975, 9489724975, etc.)
  const regex = /(\[.*?\]\(https?:\/\/[^\s)]+\)|\*\*.*?\*\*|https?:\/\/[^\s<]+|wa\.me\/[^\s<]+|(?:WhatsApp(?:\s+at|\s*:)?\s*(?:\+91[\s-]?)?0?[6-9]\d{4}[\s-]?\d{5})|(?:\+91[\s-]?)?0?[6-9]\d{4}[\s-]?\d{5})/gi;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // 1. Markdown link [Label](url)
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

    // 2. Bold text **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const inner = part.slice(2, -2).replace(/\*/g, '');
      return (
        <strong key={idx} className="font-semibold text-gold-400">
          {parseInlineFormatting(inner)}
        </strong>
      );
    }

    // 3. WhatsApp mentions with number (e.g., "WhatsApp at +91 94897 24975" or "WhatsApp: 9489724975")
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

    // 4. URLs
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

    // 5. wa.me link without protocol
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

    // 6. Phone number (handles +91, leading 0, and spaces)
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

    // Fallback: strip any stray asterisks
    return part.replace(/\*/g, '');
  });
}

function renderMessageText(content: string) {
  const cleanContent = content
    .replace(/\r\n/g, '\n')
    .replace(/\*\*\*/g, '**');

  const lines = cleanContent.split('\n');

  return (
    <div className="space-y-1.5 leading-relaxed text-cream-100">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lineIdx} className="h-1.5" />;
        }

        // Bullet lists (*, -, •)
        const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ');
        const lineContent = isBullet ? trimmed.replace(/^(\*|-|•)\s+/, '') : line;

        // Headers (### or ##)
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
              <span className="w-1.5 h-1.5 rounded-full bg-gold-400 mt-2 shrink-0"></span>
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

  // Rotate input placeholder every 3.5s to invite user typing
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
          history: messages.slice(1) // exclude the hardcoded initial greeting to save tokens
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

  // Simulates client typing into the input box when a chip is clicked
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
      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: isOpen ? 0 : 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gold-500 rounded-full shadow-2xl flex items-center justify-center text-charcoal-900 z-50 hover:bg-gold-400 transition-colors"
        aria-label="Open Chat"
      >
        <MessageSquare size={24} />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 w-full max-w-[350px] h-[520px] bg-charcoal-900/95 backdrop-blur-xl border border-gold-500/30 shadow-[0_0_40px_-8px_rgba(212,175,55,0.28),0_20px_40px_-15px_rgba(0,0,0,0.8)] rounded-2xl flex flex-col z-50 overflow-hidden overscroll-contain sm:right-6 sm:w-[400px]"
          >
            {/* Header */}
            <div className="bg-charcoal-800/90 p-4 border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-400">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="text-cream-100 font-medium">PJ Lawn Assistant</h3>
                  <p className="text-xs text-gold-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-400 inline-block"></span> Online
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-cream-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar overscroll-contain">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${msg.role === 'user' ? 'bg-white/10 text-cream-200' : 'bg-gold-500 text-charcoal-900'}`}>
                      {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-white/10 text-cream-50 rounded-tr-none' : 'bg-charcoal-800 text-cream-100 rounded-tl-none border border-white/5'}`}>
                      {renderMessageText(msg.content)}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2 max-w-[85%] flex-row">
                    <div className="w-6 h-6 rounded-full bg-gold-500 text-charcoal-900 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot size={12} />
                    </div>
                    <div className="p-4 rounded-2xl bg-charcoal-800 rounded-tl-none border border-white/5 flex gap-1">
                      <div className="w-1.5 h-1.5 bg-gold-400/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-gold-400/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-gold-400/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Predefined Starter Questions (Docked at bottom above input bar) */}
            {messages.length === 1 && !isLoading && (
              <div className="px-3 py-2.5 bg-charcoal-800/80 border-t border-white/5 backdrop-blur">
                <p className="text-[10px] uppercase tracking-wider text-gold-400 font-semibold mb-1.5 px-0.5">Quick Suggestions</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {STARTER_QUESTIONS.map((question, qIdx) => (
                    <button
                      key={qIdx}
                      type="button"
                      onClick={() => handleChipClick(question)}
                      className="px-2.5 py-1.5 rounded-lg bg-charcoal-900/90 border border-white/10 hover:border-gold-500/50 hover:bg-gold-500/15 text-cream-200 hover:text-gold-300 text-xs font-medium text-left transition-all duration-150 shadow-sm leading-tight active:scale-95 truncate"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 bg-charcoal-800 border-t border-white/10 flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={PLACEHOLDER_PROMPTS[placeholderIdx]}
                className="flex-1 bg-charcoal-900 border border-white/10 rounded-full px-4 py-2 text-sm text-cream-50 placeholder:text-cream-400/60 focus:outline-none focus:border-gold-500 transition-colors"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-full bg-gold-500 text-charcoal-900 flex items-center justify-center flex-shrink-0 hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send size={16} className="ml-0.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
