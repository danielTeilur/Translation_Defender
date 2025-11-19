import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  PLAYER_BOTTOM_OFFSET_RATIO,
  PLAYER_HEIGHT_RATIO,
  PLAYER_SPEED,
  PLAYER_WIDTH_RATIO,
  TURRET_HEIGHT_RATIO,
  TURRET_WIDTH_RATIO,
} from './constants'

export function usePlayerMovement({ gameAreaSize, keysPressedRef, disabled, speed = PLAYER_SPEED }) {
  const [playerPosition, setPlayerPosition] = useState(0.5)
  const playerPositionRef = useRef(0.5)

  useEffect(() => {
    playerPositionRef.current = playerPosition
  }, [playerPosition])

  useEffect(() => {
    if (disabled) return undefined

    let animationId = null

    const step = () => {
      const playerWidth = gameAreaSize.width * PLAYER_WIDTH_RATIO
      const minPosition = playerWidth / 2 / gameAreaSize.width
      const maxPosition = 1 - minPosition

      let nextPosition = playerPositionRef.current

      if (keysPressedRef.current.has('a') || keysPressedRef.current.has('arrowleft')) {
        nextPosition = Math.max(minPosition, nextPosition - speed)
      }
      if (keysPressedRef.current.has('d') || keysPressedRef.current.has('arrowright')) {
        nextPosition = Math.min(maxPosition, nextPosition + speed)
      }

      if (nextPosition !== playerPositionRef.current) {
        playerPositionRef.current = nextPosition
        setPlayerPosition(nextPosition)
      }

      animationId = requestAnimationFrame(step)
    }

    animationId = requestAnimationFrame(step)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [disabled, gameAreaSize.width, keysPressedRef, speed])

  const metrics = useMemo(() => {
    const playerWidth = gameAreaSize.width * PLAYER_WIDTH_RATIO
    const playerHeight = gameAreaSize.height * PLAYER_HEIGHT_RATIO
    const playerX = (playerPosition * gameAreaSize.width) - (playerWidth / 2)
    const playerY = gameAreaSize.height - playerHeight - (gameAreaSize.height * PLAYER_BOTTOM_OFFSET_RATIO)

    const turretWidth = playerWidth * TURRET_WIDTH_RATIO
    const turretHeight = playerHeight * TURRET_HEIGHT_RATIO
    const turretX = (playerPosition * gameAreaSize.width) - (turretWidth / 2)
    const turretY = playerY - turretHeight

    return {
      playerWidth,
      playerHeight,
      playerX,
      playerY,
      turretWidth,
      turretHeight,
      turretX,
      turretY,
    }
  }, [gameAreaSize.height, gameAreaSize.width, playerPosition])

  const resetPlayer = useCallback(() => {
    playerPositionRef.current = 0.5
    setPlayerPosition(0.5)
  }, [])

  return {
    playerPosition,
    playerPositionRef,
    metrics,
    resetPlayer,
  }
}
