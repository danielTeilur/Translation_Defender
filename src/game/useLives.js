import { useCallback, useState } from 'react'
import { INITIAL_LIVES } from './constants'

export function useLives(initialCount = INITIAL_LIVES) {
  const [lives, setLives] = useState(initialCount)
  const [gameOver, setGameOver] = useState(false)

  const loseLife = useCallback((amount = 1) => {
    setLives(prev => {
      const next = Math.max(0, prev - amount)
      if (next === 0) {
        setGameOver(true)
      }
      return next
    })
  }, [])

  const resetLives = useCallback(() => {
    setLives(initialCount)
    setGameOver(false)
  }, [initialCount])

  return {
    lives,
    gameOver,
    loseLife,
    resetLives,
    setGameOver,
  }
}
