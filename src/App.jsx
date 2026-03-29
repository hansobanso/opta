import { useState } from 'react'
import Sidebar from './components/layout/Sidebar'
import Chat from './components/chat/Chat'
import Quiz from './components/quiz/Quiz'
import Notes from './components/notes/Notes'
import PubMed from './components/pubmed/PubMed'
import Material from './components/material/Material'
import './index.css'

export default function App() {
  const [activeNav, setActiveNav] = useState('chat')
  const [selectedCourse, setSelectedCourse] = useState(null)

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

  return (
    <div className="app">
      <Sidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        selectedCourse={selectedCourse}
        setSelectedCourse={setSelectedCourse}
      />
      <main className="main-content">
        {renderMain()}
      </main>
    </div>
  )
}
