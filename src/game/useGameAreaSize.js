import { useEffect, useState } from 'react'
import { INITIAL_GAME_AREA } from './constants'

export function useGameAreaSize(gameAreaRef) {
  const [gameAreaSize, setGameAreaSize] = useState(INITIAL_GAME_AREA)

  useEffect(() => {
    const updateSize = () => {
      if (!gameAreaRef.current) return
      const rect = gameAreaRef.current.getBoundingClientRect()
      setGameAreaSize({ width: rect.width, height: rect.height })
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [gameAreaRef])

  return gameAreaSize
}
