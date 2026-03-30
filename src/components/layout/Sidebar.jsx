import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const NAV = [
  { id: 'chat', label: 'Chatt', icon: <svg viewBox="0 0 16 16"><path d="M2 3h12v8H9l-3 2v-2H2z"/></svg> },
  { id: 'pubmed', label: 'PubMed', icon: <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg> },
  { id: 'notes', label: 'Anteckningar', icon: <svg viewBox="0 0 16 16"><path d="M3 2h8l3 3v9H3z"/><path d="M11 2v3h3"/><path d="M6 8h4M6 11h4"/></svg> },
  { id: 'quiz', label: 'Quiz', icon: <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6"/><path d="M6.5 6a1.5 1.5 0 013 0c0 1-1.5 1.5-1.5 2.5M8 12v.5"/></svg> },
  { id: 'material', label: 'Material', icon: <svg viewBox="0 0 16 16"><path d="M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z"/></svg> },
]

export default function Sidebar({ activeNav, setActiveNav, selectedCourse, setSelectedCourse }) {
  const [courses, setCourses] = useState([])

  useEffect(() => {
    supabase.from('courses').select('id, name').order('name').then(({ data }) => {
      if (data) setCourses(data)
    })
  }, [])

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0 16px' }}>
          <div style={{ position: 'relative', display: 'inline-block', lineHeight: 1 }}>
            <span style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 52,
              fontWeight: 300,
              color: '#1a1a18',
              lineHeight: 1,
              display: 'block'
            }}>O</span>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -52%)',
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#1a1a18'
            }}/>
          </div>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 11,
            letterSpacing: 5,
            color: '#1a1a18',
            fontWeight: 400,
            marginTop: 4
          }}>OPTA</div>
        </div>
      </div>

      <div className="nav-section">
        {NAV.map(n => (
          <div
            key={n.id}
            className={`nav-item${activeNav === n.id ? ' active' : ''}`}
            onClick={() => setActiveNav(n.id)}
          >
            {n.icon}
            {n.label}
          </div>
        ))}
      </div>

      {courses.length > 0 && (
        <div className="course-section">
          <div className="nav-section-label" style={{ padding: '0 10px', marginBottom: 6 }}>Kurser</div>
          <div
            className={`course-item${!selectedCourse ? ' active' : ''}`}
            onClick={() => setSelectedCourse(null)}
          >
            Alla kurser
          </div>
          {courses.map(c => (
            <div
              key={c.id}
              className={`course-item${selectedCourse === c.id ? ' active' : ''}`}
              onClick={() => setSelectedCourse(c.id)}
            >
              {c.name}
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}
