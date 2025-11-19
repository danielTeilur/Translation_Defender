import { useCallback, useEffect, useRef, useState } from 'react'

export function useWordProgress() {
  const [selectedWords, setSelectedWords] = useState([])
  const [currentWordIndex, setCurrentWordIndex] = useState(0)

  const currentWordIndexRef = useRef(0)
  const selectedWordsRef = useRef([])

  useEffect(() => {
    currentWordIndexRef.current = currentWordIndex
  }, [currentWordIndex])

  useEffect(() => {
    selectedWordsRef.current = selectedWords
  }, [selectedWords])

  const registerCorrectWord = useCallback((word) => {
    setSelectedWords(prev => [...prev, word])
    setCurrentWordIndex(prev => prev + 1)
  }, [])

  const resetWordProgress = useCallback(() => {
    setSelectedWords([])
    setCurrentWordIndex(0)
    currentWordIndexRef.current = 0
    selectedWordsRef.current = []
  }, [])

  return {
    selectedWords,
    currentWordIndex,
    currentWordIndexRef,
    selectedWordsRef,
    registerCorrectWord,
    resetWordProgress,
  }
}
