import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

export default function Notes() {
  const [notes, setNotes] = useState([])
  const [active, setActive] = useState(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('notes').select('*').order('updated_at', { ascending: false }).then(({ data }) => {
      if (data) { setNotes(data); if (data.length > 0) open(data[0]) }
    })
  }, [])

  const open = (note) => {
    setActive(note.id)
    setTitle(note.title)
    setBody(note.body || '')
  }

  const save = useCallback(async () => {
    if (!title.trim()) return
    setSaving(true)
    if (active) {
      const { data } = await supabase.from('notes').update({ title, body, updated_at: new Date().toISOString() }).eq('id', active).select().single()
      if (data) setNotes(prev => prev.map(n => n.id === active ? data : n))
    } else {
      const { data } = await supabase.from('notes').insert({ title, body }).select().single()
      if (data) { setNotes(prev => [data, ...prev]); setActive(data.id) }
    }
    setSaving(false)
  }, [active, title, body])

  useEffect(() => {
    const t = setTimeout(save, 1000)
    return () => clearTimeout(t)
  }, [title, body, save])

  const newNote = () => {
    setActive(null)
    setTitle('')
    setBody('')
  }

  const deleteNote = async () => {
    if (!active) return
    await supabase.from('notes').delete().eq('id', active)
    const remaining = notes.filter(n => n.id !== active)
    setNotes(remaining)
    if (remaining.length > 0) open(remaining[0])
    else newNote()
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <h2>Anteckningar</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {saving && <span style={{ fontSize: 12, color: '#aaa' }}>Sparar...</span>}
          {active && <button className="btn" style={{ fontSize: 12, color: '#E24B4A', borderColor: '#E24B4A' }} onClick={deleteNote}>Radera</button>}
          <button className="btn primary" onClick={newNote}>+ Ny</button>
        </div>
      </div>
      <div className="notes-layout" style={{ flex: 1, overflow: 'hidden' }}>
        <div className="notes-list">
          {notes.length === 0 && (
            <p style={{ fontSize: 12, color: '#aaa', padding: '8px 10px' }}>Inga anteckningar än</p>
          )}
          {notes.map(n => (
            <div key={n.id} className={`note-item${active === n.id ? ' active' : ''}`} onClick={() => open(n)}>
              <div className="note-item-title">{n.title || 'Namnlös'}</div>
              <div className="note-item-preview">{n.body?.slice(0, 50) || '...'}</div>
            </div>
          ))}
        </div>
        <div className="note-editor">
          <input
            className="note-title-input"
            placeholder="Rubrik..."
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <textarea
            className="note-body-input"
            placeholder="Börja skriva..."
            value={body}
            onChange={e => setBody(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
