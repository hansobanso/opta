import { useState, useEffect } from 'react'
import Sidebar from './components/layout/Sidebar'
import Chat from './components/chat/Chat'
import Quiz from './components/quiz/Quiz'
import Notes from './components/notes/Notes'
import PubMed from './components/pubmed/PubMed'
import Material from './components/material/Material'
import Login from './components/Login'
import './index.css'

const NAV_LABELS = { chat: 'Chatt', pubmed: 'PubMed', notes: 'Anteckningar', quiz: 'Quiz', material: 'Material' }

export default function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('opta_auth'))
  const [activeNav, setActiveNav] = useState('chat')
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  if (!authed) return <Login onLogin={() => setAuthed(true)} />

  const renderMain = () => {
    switch (activeNav) {
      case 'chat': return <Chat selectedCourse={selectedCourse} />
      case 'quiz': return <Quiz selectedCourse={selectedCourse} />
      case 'notes': return <Notes />
      case 'pubmed': return <PubMed />
      case 'material': return <Material />
      default: return <Chat selectedCourse={selectedCourse} />
    }
  }

  const handleNav = (nav) => { setActiveNav(nav); setSidebarOpen(false) }
  const handleCourse = (course) => { setSelectedCourse(course); setSidebarOpen(false) }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 99 }}
        />
      )}

      <div style={{
        position: isMobile ? 'fixed' : 'relative',
        left: isMobile ? (sidebarOpen ? 0 : '-100%') : 0,
        top: 0,
        height: '100vh',
        zIndex: isMobile ? 100 : 'auto',
        transition: 'left 0.25s ease',
        flexShrink: 0
      }}>
        <Sidebar
          activeNav={activeNav}
          setActiveNav={handleNav}
          selectedCourse={selectedCourse}
          setSelectedCourse={handleCourse}
        />
      </div>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {isMobile && (
          <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '0.5px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ width: 36, height: 36, border: '0.5px solid rgba(0,0,0,0.12)', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#1a1a18" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 4h12M2 8h12M2 12h12"/>
              </svg>
            </button>
            <span style={{ fontSize: 15, fontWeight: 500 }}>{NAV_LABELS[activeNav]}</span>
          </div>
        )}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {renderMain()}
        </div>
      </main>
    </div>
  )
}
