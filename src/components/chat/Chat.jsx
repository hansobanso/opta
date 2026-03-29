import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { streamChat } from '../../lib/api'

const WELCOME = {
  role: 'assistant',
  content: 'Hej Hannes! Jag är Opta – din optometriassistent byggd på ditt KI-material. Ställ en klinisk fråga eller berätta vilket ämne du vill repetera.',
  sources: [], pubmed: []
}

export default function Chat({ selectedCourse }) {
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    const userMsg = { role: 'user', content: text, sources: [], pubmed: [] }
    const history = [...messages, userMsg]
    setMessages(history)
    setLoading(true)

    const assistantMsg = { role: 'assistant', content: '', sources: [], pubmed: [] }
    setMessages([...history, assistantMsg])

    try {
      const apiMessages = history
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }))

      for await (const chunk of streamChat(apiMessages, selectedCourse)) {
        if (chunk.type === 'sources') {
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              sources: chunk.chunks,
              pubmed: chunk.pubmed
            }
            return updated
          })
        } else if (chunk.type === 'text') {
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: updated[updated.length - 1].content + chunk.text
            }
            return updated
          })
        }
      }
    } catch (e) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1].content = 'Ett fel uppstod. Kontrollera din API-nyckel och försök igen.'
        return updated
      })
    }
    setLoading(false)
  }

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="chat-wrap">
      <div className="page-header">
        <h2>Chatt{selectedCourse ? ' – filtrerad' : ' – alla kurser'}</h2>
        {messages.length > 1 && (
          <button className="btn" onClick={() => setMessages([WELCOME])}>Rensa</button>
        )}
      </div>

      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`msg-row${msg.role === 'user' ? ' user' : ''}`}>
            <div className={`msg-avatar ${msg.role === 'user' ? 'user' : 'ai'}`}>
              {msg.role === 'user' ? 'H' : 'O'}
            </div>
            <div className="msg-body">
              <div className={`msg-bubble ${msg.role === 'user' ? 'user' : 'ai'}`}>
                {msg.content
                  ? <ReactMarkdown>{msg.content}</ReactMarkdown>
                  : loading && i === messages.length - 1
                    ? <div className="typing-dots"><span/><span/><span/></div>
                    : null
                }
              </div>
              {(msg.sources?.length > 0 || msg.pubmed?.length > 0) && (
                <div className="msg-sources">
                  {msg.sources.map((s, j) => (
                    <span key={j} className="source-pill">
                      {s.document_name || `Källa ${j + 1}`}
                    </span>
                  ))}
                  {msg.pubmed.map((p, j) => (
                    <a key={j} href={p.url} target="_blank" rel="noreferrer" className="source-pill pubmed">
                      PubMed: {p.year}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        <div className="chat-input-row">
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Ställ en fråga om ditt kursmaterial..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            style={{ height: 'auto' }}
            onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
          />
          <button className="send-btn" onClick={send} disabled={loading || !input.trim()}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M7 2l5 5-5 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
