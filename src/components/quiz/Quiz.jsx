import { useState } from 'react'

const DIFFICULTIES = ['lätt', 'medel', 'svår']

async function generateQuiz(difficulty, courseFilter) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  const prompt = `Generera en klinisk fallbaserad flervalsfråga för en optometristudent på nivå "${difficulty}".
${courseFilter ? `Fokusera på ämnesområdet: ${courseFilter}` : 'Välj ett slumpmässigt kliniskt optometriämne.'}

Svara ENDAST med giltig JSON i detta format (inga backticks, ingen förklaring):
{
  "question": "Fallbeskrivning och fråga...",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correct": 0,
  "explanation": "Förklaring till rätt svar..."
}`

  const res = await fetch('https://opta-proxy.gymbanan.workers.dev/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-calls': 'true'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }]
    })
  })
  const data = await res.json()
  const text = data.content[0]?.text || '{}'
  return JSON.parse(text)
}

export default function Quiz({ selectedCourse }) {
  const [difficulty, setDifficulty] = useState('medel')
  const [question, setQuestion] = useState(null)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  const next = async () => {
    setLoading(true)
    setSelected(null)
    setQuestion(null)
    try {
      const q = await generateQuiz(difficulty, selectedCourse)
      setQuestion(q)
    } catch {
      setQuestion({ question: 'Kunde inte generera fråga. Kontrollera API-nyckeln.', options: [], correct: 0, explanation: '' })
    }
    setLoading(false)
  }

  const answer = (i) => {
    if (selected !== null) return
    setSelected(i)
    setScore(s => ({
      correct: s.correct + (i === question.correct ? 1 : 0),
      total: s.total + 1
    }))
  }

  return (
    <div className="quiz-wrap">
      <div className="page-header">
        <h2>Quiz</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {score.total > 0 && (
            <span style={{ fontSize: 13, color: '#888' }}>
              {score.correct}/{score.total} rätt
            </span>
          )}
          <div style={{ display: 'flex', gap: 4 }}>
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                className={`btn${difficulty === d ? ' primary' : ''}`}
                style={{ padding: '5px 12px', fontSize: 12 }}
                onClick={() => setDifficulty(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="page-body">
        {!question && !loading && (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <p style={{ color: '#888', marginBottom: 20, fontSize: 14 }}>
              Fallbaserade frågor genererade av Claude utifrån klinisk optometri
            </p>
            <button className="btn primary" onClick={next}>Generera fråga</button>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div className="typing-dots" style={{ justifyContent: 'center' }}>
              <span/><span/><span/>
            </div>
          </div>
        )}

        {question && !loading && (
          <div className="quiz-card">
            <div className="quiz-difficulty">{difficulty}</div>
            <div className="quiz-question">{question.question}</div>
            <div className="quiz-options">
              {question.options?.map((opt, i) => {
                let cls = 'quiz-option'
                if (selected !== null) {
                  if (i === question.correct) cls += ' correct'
                  else if (i === selected && i !== question.correct) cls += ' wrong'
                }
                return (
                  <button key={i} className={cls} onClick={() => answer(i)} disabled={selected !== null}>
                    {opt}
                  </button>
                )
              })}
            </div>
            {selected !== null && (
              <div className="quiz-explanation">{question.explanation}</div>
            )}
            {selected !== null && (
              <div className="quiz-controls">
                <button className="btn primary" onClick={next}>Nästa fråga</button>
                <button className="btn" onClick={() => setScore({ correct: 0, total: 0 })}>Nollställ poäng</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
