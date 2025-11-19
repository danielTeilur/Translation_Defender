export function getPlayerCollisionIndices(rects, playerMetrics) {
  if (!playerMetrics) return []

  const { playerX, playerY, playerWidth, playerHeight } = playerMetrics
  const playerLeft = playerX
  const playerRight = playerX + playerWidth
  const playerTop = playerY
  const playerBottom = playerY + playerHeight

  const collisions = []

  rects.forEach((rect, index) => {
    const rectLeft = rect.x
    const rectRight = rect.x + rect.width
    const rectTop = rect.y
    const rectBottom = rect.y + rect.height

    const isColliding =
      playerLeft < rectRight &&
      playerRight > rectLeft &&
      playerTop < rectBottom &&
      playerBottom > rectTop

    if (isColliding) {
      collisions.push(index)
    }
  })

  return collisions
}

import { sanitizeWord } from './wordUtils'

export function resolveBulletBoxCollisions({
  rects,
  bullets,
  bulletSize,
  expectedWord,
  onCorrectWord,
  onIncorrectWord,
}) {
  const bulletsToRemove = new Set()
  const boxUpdates = new Map()

  bullets.forEach(bullet => {
    const bulletLeft = bullet.x - (bulletSize / 2)
    const bulletRight = bullet.x + (bulletSize / 2)
    const bulletTop = bullet.y - (bulletSize / 2)
    const bulletBottom = bullet.y + (bulletSize / 2)

    rects.forEach((rect, rectIndex) => {
      if (boxUpdates.get(rectIndex) === 'remove') return

      const rectLeft = rect.x
      const rectRight = rect.x + rect.width
      const rectTop = rect.y
      const rectBottom = rect.y + rect.height

      const isColliding =
        bulletLeft < rectRight &&
        bulletRight > rectLeft &&
        bulletTop < rectBottom &&
        bulletBottom > rectTop

      if (!isColliding) return

      bulletsToRemove.add(bullet.id)

      if (bullet.color === 'green') {
        const normalizedRectWord = sanitizeWord(rect.word)
        const isCorrectWord = normalizedRectWord && normalizedRectWord === expectedWord
        if (isCorrectWord) {
          onCorrectWord?.(rect.word)
        } else {
          onIncorrectWord?.()
        }
        boxUpdates.set(rectIndex, 'remove')
      } else if (bullet.color === 'red') {
        const newHitCount = (rect.hitCount || 0) + 1
        if (newHitCount >= 3) {
          boxUpdates.set(rectIndex, 'remove')
        } else {
          boxUpdates.set(rectIndex, { ...rect, hitCount: newHitCount })
        }
      }
    })
  })

  if (boxUpdates.size === 0) {
    return {
      nextRects: rects,
      bulletsToRemove,
    }
  }

  const nextRects = []

  rects.forEach((rect, index) => {
    const update = boxUpdates.get(index)
    if (update === 'remove') return
    if (update) {
      nextRects.push(update)
      return
    }
    nextRects.push(rect)
  })

  return { nextRects, bulletsToRemove }
}
