import { useEffect, useRef } from 'react'
import {
  BULLET_SIZE_RATIO,
  PLAYER_BOTTOM_OFFSET_RATIO,
  PLAYER_HEIGHT_RATIO,
  PLAYER_WIDTH_RATIO,
} from './constants'
import { getPlayerCollisionIndices, resolveBulletBoxCollisions } from './collisionUtils'
import { sanitizeWord } from './wordUtils'

export function useGameLoop({
  gameAreaRef,
  gameAreaSize,
  playerPositionRef,
  rectsRef,
  updatePositions,
  trySpawnBox,
  setRects,
  syncRects,
  spawnInterval,
  updateInterval,
  currentPhrase,
  currentWordIndexRef,
  updateBullets,
  removeBullets,
  bulletsRef,
  loseLife,
  onCorrectWord,
  onIncorrectWord,
  gameOver,
}) {
  const lastUpdateTimeRef = useRef(Date.now())

  useEffect(() => {
    if (!gameAreaRef.current) return undefined

    let animationId = null

    const runLoop = () => {
      if (gameOver) return

      const now = Date.now()
      updatePositions(now)

      const playerWidth = gameAreaSize.width * PLAYER_WIDTH_RATIO
      const playerHeight = gameAreaSize.height * PLAYER_HEIGHT_RATIO
      const playerX = (playerPositionRef.current * gameAreaSize.width) - (playerWidth / 2)
      const playerY = gameAreaSize.height - playerHeight - (gameAreaSize.height * PLAYER_BOTTOM_OFFSET_RATIO)

      const playerMetrics = {
        playerWidth,
        playerHeight,
        playerX,
        playerY,
      }

      const playerCollisions = getPlayerCollisionIndices(rectsRef.current, playerMetrics)
      if (playerCollisions.length > 0) {
        const indicesToRemove = new Set(playerCollisions)
        playerCollisions.forEach(() => loseLife())
        setRects(rectsRef.current.filter((_, index) => !indicesToRemove.has(index)))
      }

      const bulletSize = gameAreaSize.width * BULLET_SIZE_RATIO
      const expectedWord = sanitizeWord(currentPhrase?.words?.[currentWordIndexRef.current] || '')
      const { nextRects, bulletsToRemove } = resolveBulletBoxCollisions({
        rects: rectsRef.current,
        bullets: bulletsRef.current,
        bulletSize,
        expectedWord,
        onCorrectWord,
        onIncorrectWord,
      })

      if (bulletsToRemove.size > 0) {
        removeBullets(bulletsToRemove)
      }

      setRects(nextRects)

      updateBullets()
      trySpawnBox(now, currentPhrase, spawnInterval)

      if (now - lastUpdateTimeRef.current >= updateInterval) {
        syncRects()
        lastUpdateTimeRef.current = now
      }

      animationId = requestAnimationFrame(runLoop)
    }

    animationId = requestAnimationFrame(runLoop)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [
    currentPhrase,
    gameAreaRef,
    gameAreaSize.height,
    gameAreaSize.width,
    gameOver,
    loseLife,
    onCorrectWord,
    onIncorrectWord,
    rectsRef,
    removeBullets,
    setRects,
    spawnInterval,
    syncRects,
    trySpawnBox,
    updateBullets,
    updateInterval,
    updatePositions,
  ])
}
