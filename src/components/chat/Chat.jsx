import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { streamChat } from '../../lib/api'
import { supabase } from '../../lib/supabase'

const WELCOME = {
  role: 'assistant',
  content: 'Hej Hannes! Jag är Opta – din optometriassistent byggd på ditt KI-material. Ställ en klinisk fråga eller berätta vilket ämne du vill repetera.',
  sources: [], pubmed: []
}

export default function Chat({ selectedCourse }) {
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadSessions = async () => {
    const { data } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(20)
    if (data) setSessions(data)
  }

  const loadSession = async (session) => {
    setActiveSession(session)
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at')
    if (data && data.length > 0) {
      setMessages(data.map(m => ({ ...m, sources: [], pubmed: [] })))
    } else {
      setMessages([WELCOME])
    }
  }

  const newSession = () => {
    setActiveSession(null)
    setMessages([WELCOME])
  }

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    let sessionId = activeSession?.id
    if (!sessionId) {
      const { data } = await supabase
        .from('chat_sessions')
        .insert({ title: text.slice(0, 50) })
        .select()
        .single()
      if (data) {
        sessionId = data.id
        setActiveSession(data)
        setSessions(prev => [data, ...prev])
      }
    }

    const userMsg = { role: 'user', content: text, sources: [], pubmed: [] }
    const history = [...messages, userMsg]
    setMessages(history)
    setLoading(true)

    await supabase.from('chat_messages').insert({ role: 'user', content: text, session_id: sessionId })

    const assistantMsg = { role: 'assistant', content: '', sources: [], pubmed: [] }
    setMessages([...history, assistantMsg])

    let fullText = ''

    try {
      const apiMessages = history
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }))

      for await (const chunk of streamChat(apiMessages, selectedCourse)) {
        if (chunk.type === 'sources') {
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { ...updated[updated.length - 1], sources: chunk.chunks, pubmed: chunk.pubmed }
            return updated
          })
        } else if (chunk.type === 'text') {
          fullText += chunk.text
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { ...updated[updated.length - 1], content: fullText }
            return updated
          })
        }
      }

      await supabase.from('chat_messages').insert({ role: 'assistant', content: fullText, session_id: sessionId })
      await supabase.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId)
      loadSessions()

    } catch (e) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1].content = 'Ett fel uppstod. Försök igen.'
        return updated
      })
    }
    setLoading(false)
  }

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ width: 200, minWidth: 200, borderRight: '0.5px solid rgba(0,0,0,0.08)', background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 12px 8px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
          <button className="btn primary" style={{ width: '100%', fontSize: 12 }} onClick={newSession}>+ Ny chatt</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {sessions.map(s => (
            <div
              key={s.id}
              onClick={() => loadSession(s)}
              style={{
                padding: '7px 10px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
                color: activeSession?.id === s.id ? '#0F6E56' : '#555',
                background: activeSession?.id === s.id ? '#E1F5EE' : 'transparent',
                marginBottom: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {s.title}
            </div>
          ))}
        </div>
      </div>

      <div className="chat-wrap">
        <div className="page-header">
          <h2>Chatt{selectedCourse ? ' – filtrerad' : ' – alla kurser'}</h2>
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
                      <span key={j} className="source-pill">{s.document_name || `Källa ${j + 1}`}</span>
                    ))}
                    {msg.pubmed.map((p, j) => (
                      <a key={j} href={p.url} target="_blank" rel="noreferrer" className="source-pill pubmed">PubMed: {p.year}</a>
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
              rows={1}
              placeholder="Ställ en fråga om ditt kursmaterial..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
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
    </div>
  )
}
