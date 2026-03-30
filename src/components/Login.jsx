import { useState } from 'react'

const PASSWORD = 'opta2024'

export default function Login({ onLogin }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  const attempt = () => {
    if (input === PASSWORD) {
      localStorage.setItem('opta_auth', '1')
      onLogin()
    } else {
      setError(true)
      setInput('')
    }
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f4f0',
      fontFamily: "'DM Sans', sans-serif"
    }}>
      <div style={{
        background: '#fff',
        border: '0.5px solid rgba(0,0,0,0.08)',
        borderRadius: 16,
        padding: '48px 40px',
        width: 340,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, fontWeight: 300, lineHeight: 1, color: '#1a1a18', position: 'relative', display: 'inline-block' }}>
            O
            <div style={{ position: 'absolute', top: '52%', left: '50%', transform: 'translate(-50%, -50%)', width: 6, height: 6, borderRadius: '50%', background: '#1a1a18' }}/>
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, letterSpacing: 5, color: '#999', marginTop: 4 }}>OPTA</div>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="password"
            placeholder="Lösenord"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false) }}
            onKeyDown={e => e.key === 'Enter' && attempt()}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: error ? '0.5px solid #E24B4A' : '0.5px solid rgba(0,0,0,0.15)',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              outline: 'none',
              background: '#f5f4f0'
            }}
          />
          {error && <p style={{ fontSize: 12, color: '#E24B4A', margin: 0 }}>Fel lösenord</p>}
          <button
            onClick={attempt}
            style={{
              padding: '10px',
              borderRadius: 8,
              border: 'none',
              background: '#1a1a18',
              color: '#fff',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Logga in
          </button>
        </div>
      </div>
    </div>
  )
}
