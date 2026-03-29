import { useState } from 'react'
import { searchPubMed } from '../../lib/api'

export default function PubMed() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const QUICK = ['myopia control', 'keratoconus scleral lens', 'dry eye treatment', 'glaucoma diagnosis', 'orthokeratology']

  const search = async (q) => {
    const term = q || query
    if (!term.trim()) return
    setLoading(true)
    setSearched(true)
    const res = await searchPubMed(term, 10)
    setResults(res)
    setLoading(false)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <h2>PubMed</h2>
        <span style={{ fontSize: 12, color: '#aaa' }}>Aktuell forskning inom optometri</span>
      </div>
      <div className="page-body">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.15)', fontFamily: 'inherit', fontSize: 13, outline: 'none', background: '#fff' }}
            placeholder="Sök på PubMed..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
          />
          <button className="btn primary" onClick={() => search()}>Sök</button>
        </div>

        {!searched && (
          <div>
            <p style={{ fontSize: 12, color: '#aaa', marginBottom: 10 }}>Snabbsök</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {QUICK.map(q => (
                <button key={q} className="btn" style={{ fontSize: 12 }} onClick={() => { setQuery(q); search(q) }}>{q}</button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="typing-dots" style={{ paddingTop: 20 }}>
            <span/><span/><span/>
          </div>
        )}

        {results.map(a => (
          <div key={a.id} className="pubmed-article">
            <div className="pubmed-title">{a.title}</div>
            <div className="pubmed-meta">{a.authors} · {a.journal} · {a.year}</div>
            <a href={a.url} target="_blank" rel="noreferrer" className="pubmed-link">Öppna på PubMed →</a>
          </div>
        ))}

        {searched && !loading && results.length === 0 && (
          <p style={{ color: '#aaa', fontSize: 13 }}>Inga resultat hittades.</p>
        )}
      </div>
    </div>
  )
}
