import { useCallback, useRef, useState } from 'react'
import { BULLET_REMOVE_OFFSET_RATIO } from './constants'

export function useBulletManager({ gameAreaSize, bulletSpeed }) {
  const [bullets, setBullets] = useState([])
  const bulletsRef = useRef([])

  const spawnBullet = useCallback((color, turretMetrics) => {
    if (!turretMetrics) return

    const now = Date.now()
    const { turretX, turretWidth, turretY } = turretMetrics

    const newBullet = {
      id: `bullet-${now}-${Math.random()}`,
      x: turretX + (turretWidth / 2),
      y: turretY,
      color,
      startTime: now,
    }

    bulletsRef.current = [...bulletsRef.current, newBullet]
    setBullets([...bulletsRef.current])
  }, [])

  const updateBullets = useCallback(() => {
    bulletsRef.current = bulletsRef.current
      .map(bullet => ({
        ...bullet,
        y: bullet.y - (gameAreaSize.height * bulletSpeed),
      }))
      .filter(bullet => bullet.y > -gameAreaSize.height * BULLET_REMOVE_OFFSET_RATIO)

    setBullets([...bulletsRef.current])
    return bulletsRef.current
  }, [bulletSpeed, gameAreaSize.height])

  const removeBullets = useCallback((idsToRemove) => {
    if (!idsToRemove || idsToRemove.size === 0) return
    bulletsRef.current = bulletsRef.current.filter(bullet => !idsToRemove.has(bullet.id))
    setBullets([...bulletsRef.current])
  }, [])

  const resetBullets = useCallback(() => {
    bulletsRef.current = []
    setBullets([])
  }, [])

  return {
    bullets,
    bulletsRef,
    spawnBullet,
    updateBullets,
    removeBullets,
    resetBullets,
  }
}
