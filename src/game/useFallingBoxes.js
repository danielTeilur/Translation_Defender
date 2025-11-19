import { useCallback, useRef, useState } from 'react'
import { BOX_HEIGHT_RATIO, BOX_WIDTH_RATIO } from './constants'

const BASIC_DISTRACTORS = ['good', 'bad', 'nice', 'maybe', 'sure', 'fine', 'hello', 'great', 'okay']

export function useFallingBoxes({
  gameAreaSize,
  fallDuration,
  distractorPool = [],
  correctWordProbability = 0.7,
}) {
  const [fallingRects, setFallingRects] = useState([])
  const rectsRef = useRef([])
  const lastSpawnTimeRef = useRef(Date.now())

  const updatePositions = useCallback((now) => {
    rectsRef.current = rectsRef.current
      .map(rect => {
        const elapsed = now - rect.startTime
        const progress = Math.min(elapsed / fallDuration, 1)
        return {
          ...rect,
          y: progress * gameAreaSize.height,
        }
      })
      .filter(rect => rect.y < gameAreaSize.height)
  }, [fallDuration, gameAreaSize.height])

  const trySpawnBox = useCallback((now, phrase, spawnInterval) => {
    if (now - lastSpawnTimeRef.current < spawnInterval) return

    const rectWidth = gameAreaSize.width * BOX_WIDTH_RATIO
    const rectHeight = gameAreaSize.height * BOX_HEIGHT_RATIO
    const maxX = Math.max(0, gameAreaSize.width - rectWidth)

    const isCorrectWord = Math.random() < correctWordProbability
    let word
    let wordIndex
    let isCorrect

    if (isCorrectWord && phrase?.words?.length) {
      wordIndex = Math.floor(Math.random() * phrase.words.length)
      word = phrase.words[wordIndex]
      isCorrect = true
    } else {
      const pool = distractorPool && distractorPool.length > 0 ? distractorPool : BASIC_DISTRACTORS
      word = pool[Math.floor(Math.random() * pool.length)]
      wordIndex = -1
      isCorrect = false
    }

    const newRect = {
      id: `${now}-${Math.random()}`,
      x: Math.max(0, Math.random() * maxX),
      y: 0,
      width: rectWidth,
      height: rectHeight,
      startTime: now,
      hitCount: 0,
      word,
      wordIndex,
      isCorrectWord: isCorrect,
    }

    rectsRef.current = [...rectsRef.current, newRect]
    lastSpawnTimeRef.current = now
  }, [correctWordProbability, distractorPool, gameAreaSize.height, gameAreaSize.width])

  const setRects = useCallback((nextRects) => {
    rectsRef.current = typeof nextRects === 'function' ? nextRects(rectsRef.current) : nextRects
  }, [])

  const syncFromRef = useCallback(() => {
    setFallingRects([...rectsRef.current])
  }, [])

  const resetBoxes = useCallback(() => {
    rectsRef.current = []
    setFallingRects([])
    lastSpawnTimeRef.current = Date.now()
  }, [])

  return {
    fallingRects,
    rectsRef,
    updatePositions,
    trySpawnBox,
    setRects,
    syncFromRef,
    resetBoxes,
  }
}
