import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Material() {
  const [docs, setDocs] = useState([])
  const [courses, setCourses] = useState([])

  useEffect(() => {
    supabase.from('documents').select('*, courses(name)').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setDocs(data)
    })
    supabase.from('courses').select('id, name').order('name').then(({ data }) => {
      if (data) setCourses(data)
    })
  }, [])

  const icon = (type) => {
    if (type === 'pdf') return '📄'
    if (type === 'pptx' || type === 'ppt') return '📊'
    if (type === 'xlsx' || type === 'xls') return '📈'
    return '📁'
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <h2>Material</h2>
        <span style={{ fontSize: 12, color: '#aaa' }}>{docs.length} filer indexerade</span>
      </div>
      <div className="page-body">
        {docs.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <p style={{ color: '#aaa', fontSize: 14, marginBottom: 8 }}>Inga filer indexerade än</p>
            <p style={{ color: '#bbb', fontSize: 12 }}>Kör inmatningsscriptet för att ladda upp ditt kursmaterial</p>
          </div>
        ) : (
          <>
            {courses.map(course => {
              const courseDocs = docs.filter(d => d.course_id === course.id)
              if (!courseDocs.length) return null
              return (
                <div key={course.id} style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 500, color: '#888', marginBottom: 10 }}>{course.name}</h3>
                  <div className="material-grid">
                    {courseDocs.map(doc => (
                      <div key={doc.id} className="material-card">
                        <div className="material-icon">{icon(doc.file_type)}</div>
                        <div className="material-name">{doc.filename}</div>
                        <div className="material-meta">{doc.file_type?.toUpperCase()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
