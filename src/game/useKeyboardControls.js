import { useCallback, useEffect, useRef } from 'react'

export function useKeyboardControls(onShoot, externalKeysRef) {
  const keysPressedRef = externalKeysRef ?? useRef(new Set())

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase()

      if (key === 'a' || key === 'd' || key === 'arrowleft' || key === 'arrowright') {
        event.preventDefault()
        keysPressedRef.current.add(key)
        return
      }

      keysPressedRef.current.add(key)

      if (key === 'k' || key === 'l') {
        event.preventDefault()
        onShoot?.(key === 'k' ? 'green' : 'red')
      }
    }

    const handleKeyUp = (event) => {
      const key = event.key.toLowerCase()
      keysPressedRef.current.delete(key)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [onShoot])

  const resetKeys = useCallback(() => {
    keysPressedRef.current.clear()
  }, [])

  return { keysPressedRef, resetKeys }
}
