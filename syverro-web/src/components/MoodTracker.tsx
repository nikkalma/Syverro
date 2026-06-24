// src/components/MoodTracker.tsx

import { useState } from 'react'
import { useOffline } from '@/lib/offline'

interface MoodTrackerProps {
  bookId: string
}

const MOOD_OPTIONS = [
  '😊 счастлив',
  '🧘 спокоен',
  '🤔 задумчив',
  '😢 грустен',
  '🤯 впечатлён',
  '😴 уставший'
]

export function MoodTracker({ bookId }: MoodTrackerProps) {
  const { trackMood } = useOffline()
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [effect, setEffect] = useState('')

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood)
    trackMood(bookId, mood, effect || undefined)
    console.log('🎭 Настроение сохранено:', mood)
  }

  return (
    <div className="mood-tracker">
      <h4>Как книга влияет на настроение?</h4>
      <div className="mood-grid">
        {MOOD_OPTIONS.map((mood) => (
          <button
            key={mood}
            onClick={() => handleMoodSelect(mood)}
            className={selectedMood === mood ? 'active' : ''}
          >
            {mood}
          </button>
        ))}
      </div>
      <input
        type="text"
        placeholder="Эффект книги (опционально)..."
        value={effect}
        onChange={(e) => setEffect(e.target.value)}
        onBlur={() => {
          if (effect && selectedMood) {
            trackMood(bookId, selectedMood, effect)
          }
        }}
      />
    </div>
  )
}