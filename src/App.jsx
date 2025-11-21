import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { useGameAreaSize } from './game/useGameAreaSize'
import { useLives } from './game/useLives'
import { useWordProgress } from './game/useWordProgress'
import { useFallingBoxes } from './game/useFallingBoxes'
import { useBulletManager } from './game/useBulletManager'
import { usePlayerMovement } from './game/usePlayerMovement'
import { useKeyboardControls } from './game/useKeyboardControls'
import { useGameLoop } from './game/useGameLoop'
import {
  BULLET_SPEED,
  FALL_DURATION,
  PLAYER_SPEED,
  SPAWN_INTERVAL,
  UPDATE_INTERVAL,
} from './game/constants'
import { normalizeWords, sanitizeWord } from './game/wordUtils'
import { DISTRACTOR_WORDS } from './game/distractorWords'
import { sampleArray, shuffleArray } from './game/arrayUtils'
import phrasesData from './game/phrases.json'

const MIN_DISTRACTOR_WORDS = 5
const MAX_DISTRACTOR_WORDS = 10
const SCORE_DISTRACTOR_STEP = 5
const CORRECT_WORD_WEIGHT = 1.84
const DISTRACTOR_WORD_WEIGHT = 0.8

const DIFFICULTY_INDEX_MAP = phrasesData.reduce(
  (acc, phrase, index) => {
    const difficulty = (phrase.difficulty || 'easy').toLowerCase()
    if (!acc[difficulty]) acc[difficulty] = []
    acc[difficulty].push(index)
    return acc
  },
  { easy: [], intermediate: [], advanced: [] },
)

const createDifficultyPools = () => ({
  easy: shuffleArray(DIFFICULTY_INDEX_MAP.easy),
  intermediate: shuffleArray(DIFFICULTY_INDEX_MAP.intermediate),
  advanced: shuffleArray(DIFFICULTY_INDEX_MAP.advanced),
})

const DIFFICULTY_DISTRIBUTIONS = [
  { maxScore: 10, weights: { easy: 0.9, intermediate: 0.07, advanced: 0.03 } },
  { maxScore: 20, weights: { easy: 0.5, intermediate: 0.3, advanced: 0.2 } },
  { maxScore: 30, weights: { easy: 0.1, intermediate: 0.6, advanced: 0.3 } },
  { maxScore: Infinity, weights: { easy: 0.05, intermediate: 0.35, advanced: 0.6 } },
]

const getDifficultyWeightsForScore = (score) => {
  return DIFFICULTY_DISTRIBUTIONS.find(group => score <= group.maxScore)?.weights ?? DIFFICULTY_DISTRIBUTIONS[0].weights
}

const ensurePoolHasEntries = (pools, difficulty) => {
  const base = DIFFICULTY_INDEX_MAP[difficulty]
  if (!base || base.length === 0) return false
  if (!pools[difficulty] || pools[difficulty].length === 0) {
    pools[difficulty] = shuffleArray(base)
  }
  return pools[difficulty].length > 0
}

const pickDifficultyForScore = (score, pools) => {
  const weights = getDifficultyWeightsForScore(score)
  const entries = Object.entries(weights)
  let rand = Math.random()
  for (const [difficulty, weight] of entries) {
    rand -= weight
    if (rand <= 0 && ensurePoolHasEntries(pools, difficulty)) {
      return difficulty
    }
  }
  const sortedByWeight = [...entries].sort((a, b) => b[1] - a[1])
  for (const [difficulty] of sortedByWeight) {
    if (ensurePoolHasEntries(pools, difficulty)) {
      return difficulty
    }
  }
  for (const difficulty of Object.keys(DIFFICULTY_INDEX_MAP)) {
    if (ensurePoolHasEntries(pools, difficulty)) {
      return difficulty
    }
  }
  return null
}

const selectNextPhraseIndexForScore = (score, pools) => {
  const difficulty = pickDifficultyForScore(score, pools)
  if (!difficulty || !pools[difficulty] || pools[difficulty].length === 0) {
    return null
  }
  const [nextIndex, ...rest] = pools[difficulty]
  pools[difficulty] = rest
  return nextIndex
}

const getBoxFontSize = (word = '') => {
  const length = word.length
  if (length <= 6) return '1rem'
  if (length <= 8) return '0.9rem'
  if (length <= 10) return '0.85rem'
  if (length <= 12) return '0.8rem'
  if (length <= 15) return '0.7rem'
  if (length <= 18) return '0.62rem'
  if (length <= 22) return '0.56rem'
  return '0.5rem'
}

function App() {
  const gameAreaRef = useRef(null)
  const keysPressedRef = useRef(new Set())
  const [score, setScore] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const phrasePoolsRef = useRef(createDifficultyPools())
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(() =>
    selectNextPhraseIndexForScore(0, phrasePoolsRef.current),
  )
  const currentPhrase = currentPhraseIndex !== null ? phrasesData[currentPhraseIndex] : null
  const currentPhraseWords = currentPhrase?.words ?? []

  const gameAreaSize = useGameAreaSize(gameAreaRef)
  const { lives, gameOver, loseLife, resetLives, setGameOver } = useLives()
  const {
    selectedWords,
    currentWordIndexRef,
    registerCorrectWord,
    resetWordProgress,
  } = useWordProgress()

  const normalizedTargetWords = useMemo(
    () => normalizeWords(currentPhraseWords),
    [currentPhraseWords],
  )

  const normalizedSelectedCount = useMemo(
    () => selectedWords.map(word => sanitizeWord(word)).filter(Boolean).length,
    [selectedWords],
  )

  const distractorWordCount = useMemo(() => {
    const increments = Math.floor(score / SCORE_DISTRACTOR_STEP)
    return Math.min(MIN_DISTRACTOR_WORDS + increments, MAX_DISTRACTOR_WORDS)
  }, [score])

  const correctWordProbability = useMemo(() => {
    const totalWeight = CORRECT_WORD_WEIGHT + DISTRACTOR_WORD_WEIGHT
    return CORRECT_WORD_WEIGHT / totalWeight
  }, [])

  const activeDistractors = useMemo(
    () => sampleArray(DISTRACTOR_WORDS, distractorWordCount),
    [currentPhraseIndex, distractorWordCount],
  )

  const fallSpeedMultiplier = useMemo(
    () => Math.min(1 + (score * 0.02), 1.5),
    [score],
  )

  const dynamicFallDuration = useMemo(
    () => FALL_DURATION / fallSpeedMultiplier,
    [fallSpeedMultiplier],
  )

  const {
    fallingRects,
    rectsRef,
    updatePositions,
    trySpawnBox,
    setRects,
    syncFromRef,
    resetBoxes,
  } = useFallingBoxes({
    gameAreaSize,
    fallDuration: dynamicFallDuration,
    distractorPool: activeDistractors,
    correctWordProbability,
  })

  const {
    bullets,
    bulletsRef,
    spawnBullet,
    updateBullets,
    removeBullets,
    resetBullets,
  } = useBulletManager({ gameAreaSize, bulletSpeed: BULLET_SPEED })

  const { playerPositionRef, metrics, resetPlayer } = usePlayerMovement({
    gameAreaSize,
    keysPressedRef,
    disabled: gameOver,
    speed: PLAYER_SPEED,
  })

  const handleShoot = useCallback(
    (color) => {
      spawnBullet(color, metrics)
    },
    [metrics, spawnBullet],
  )

  const { resetKeys } = useKeyboardControls(handleShoot, keysPressedRef)

  const handleCorrectWord = useCallback(
    (word) => {
      registerCorrectWord(word)
    },
    [registerCorrectWord],
  )

  const handleIncorrectWord = useCallback(() => {
    loseLife()
  }, [loseLife])

  const advanceToNextPhrase = useCallback((nextScore) => {
    const pools = phrasePoolsRef.current
    const nextIndex = selectNextPhraseIndexForScore(nextScore, pools)
    if (nextIndex === null || nextIndex === undefined) {
      setGameOver(true)
      return
    }
    setCurrentPhraseIndex(nextIndex)
  }, [setGameOver])

  useEffect(() => {
    if (
      !gameOver &&
      hasStarted &&
      currentPhrase &&
      normalizedTargetWords.length > 0 &&
      normalizedSelectedCount === normalizedTargetWords.length
    ) {
      setScore(prevScore => {
        const updatedScore = prevScore + 1
        advanceToNextPhrase(updatedScore)
        return updatedScore
      })
      resetWordProgress()
      resetBoxes()
      resetBullets()
    }
  }, [
    advanceToNextPhrase,
    currentPhrase,
    hasStarted,
    gameOver,
    normalizedSelectedCount,
    normalizedTargetWords.length,
    resetBoxes,
    resetBullets,
    resetWordProgress,
  ])

  const isGamePaused = !hasStarted || gameOver

  useGameLoop({
    gameAreaRef,
    gameAreaSize,
    playerPositionRef,
    rectsRef,
    updatePositions,
    trySpawnBox,
    setRects,
    syncRects: syncFromRef,
    spawnInterval: SPAWN_INTERVAL,
    updateInterval: UPDATE_INTERVAL,
    currentPhrase,
    currentWordIndexRef,
    updateBullets,
    removeBullets,
    bulletsRef,
    loseLife,
    onCorrectWord: handleCorrectWord,
    onIncorrectWord: handleIncorrectWord,
    gameOver: isGamePaused,
  })

  const resetGame = useCallback(() => {
    resetLives()
    resetWordProgress()
    resetPlayer()
    resetBullets()
    resetBoxes()
    resetKeys()
    setScore(0)
    phrasePoolsRef.current = createDifficultyPools()
    const initialIndex = selectNextPhraseIndexForScore(0, phrasePoolsRef.current)
    setCurrentPhraseIndex(initialIndex)
    setHasStarted(true)
  }, [
    resetBullets,
    resetBoxes,
    resetKeys,
    resetLives,
    resetPlayer,
    resetWordProgress,
  ])

  const redirectToEnglishCode = () => {
    window.location.href = 'https://platform.englishcode.ai/'
  }

  const handleStartGame = useCallback(() => {
    setHasStarted(true)
    setGameOver(false)
    requestAnimationFrame(() => {
      gameAreaRef.current?.focus()
    })
  }, [setGameOver])

  const {
    playerX,
    playerY,
    playerWidth,
    playerHeight,
    turretX,
    turretY,
    turretWidth,
    turretHeight,
  } = metrics

  const remainingPlaceholders = Math.max(currentPhraseWords.length - selectedWords.length, 0)
  const currentEnglishText = currentPhrase?.englishText ?? currentPhraseWords.join(' ')

  return (
    <div className="app-container">
      {!hasStarted && (
        <div className="initial-overlay">
          <div className="initial-content">
            <h1 className="initial-title">Translation Defender</h1>
            <p className="initial-text">
              Build the English sentence word by word to push your score as high as possible.
            </p>
            <ul className="initial-list">
              <li>Move with <strong>A / D</strong> or the <strong>← / →</strong> arrow keys.</li>
              <li>
                Press <strong>K</strong> to fire a green bullet and confirm the next correct word in order.
              </li>
              <li>
                Press <strong>L</strong> to fire a red bullet; it takes <strong>3 hits</strong> to clear any box and
                makes room for new words.
              </li>
              <li>Green bullets need only one hit to lock in the matching box.</li>
              <li>Keep confirming words to complete each phrase and boost your score.</li>
            </ul>
            <button className="initial-button" onClick={handleStartGame}>
              Start Game
            </button>
          </div>
        </div>
      )}
      <div className="spanish-phrase-display">
        <h2 className="phrase-label">Translate:</h2>
        <p className="spanish-phrase-text">
          {currentPhrase?.spanishText ?? 'All phrases completed!'}
        </p>
      </div>

      <div className="controls-panel">
        <h2 className="controls-title">Controls</h2>
        <ul className="controls-list">
          <li>
            <strong>Move:</strong> A / D or ← / →
          </li>
          <li>
            <strong>Green (K):</strong> confirm the next correct word
          </li>
          <li>
            <strong>Red (L):</strong> remove boxes (3 hits to clear)
          </li>
        </ul>
      </div>

      <div className="lives-section">
        <div className="lives-counter">Lives: {lives}</div>
        <div className="score-counter">Score: {score}</div>
      </div>

      <div className="translation-progress">
        <h3 className="progress-label">Your translation:</h3>
        <div className="selected-words-container">
          {selectedWords.map((word, index) => (
            <span key={index} className="word-token">
              {word}
            </span>
          ))}
          {Array(remainingPlaceholders)
            .fill(0)
            .map((_, index) => (
              <span key={`placeholder-${index}`} className="word-placeholder">
                _
              </span>
            ))}
        </div>
      </div>

      <div className="game-area" ref={gameAreaRef} tabIndex={0} style={{ outline: 'none' }}>
        <div
          className="player-tank"
          style={{
            left: `${(playerX / gameAreaSize.width) * 100}%`,
            top: `${(playerY / gameAreaSize.height) * 100}%`,
            width: `${(playerWidth / gameAreaSize.width) * 100}%`,
            height: `${(playerHeight / gameAreaSize.height) * 100}%`,
          }}
        />

        <div
          className="player-turret"
          style={{
            left: `${(turretX / gameAreaSize.width) * 100}%`,
            top: `${(turretY / gameAreaSize.height) * 100}%`,
            width: `${(turretWidth / gameAreaSize.width) * 100}%`,
            height: `${(turretHeight / gameAreaSize.height) * 100}%`,
          }}
        />

        {fallingRects.map(rect => {
          const hitCount = rect.hitCount || 0
          let colorClass = 'falling-rect-blue'
          if (hitCount === 1) colorClass = 'falling-rect-yellow'
          if (hitCount === 2) colorClass = 'falling-rect-red'

          return (
            <div
              key={rect.id}
              className={`falling-rect ${colorClass}`}
              style={{
                left: `${(rect.x / gameAreaSize.width) * 100}%`,
                top: `${(rect.y / gameAreaSize.height) * 100}%`,
                width: `${(rect.width / gameAreaSize.width) * 100}%`,
                height: `${(rect.height / gameAreaSize.height) * 100}%`,
              }}
            >
              <span
                className="box-word"
                style={{ fontSize: getBoxFontSize(rect.word || '') }}
              >
                {rect.word || ''}
              </span>
            </div>
          )
        })}

        {bullets.map(bullet => {
          const bulletSize = gameAreaSize.width * 0.015
          return (
            <div
              key={bullet.id}
              className={`bullet bullet-${bullet.color}`}
              style={{
                left: `${(bullet.x / gameAreaSize.width) * 100}%`,
                top: `${(bullet.y / gameAreaSize.height) * 100}%`,
                width: `${(bulletSize / gameAreaSize.width) * 100}%`,
                height: `${(bulletSize / gameAreaSize.width) * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          )
        })}
      </div>

      {gameOver && (
        <div className="game-over-modal">
          <div className="game-over-content">
            <h1 className="game-over-title">Game Over</h1>
            <p className="game-over-subtitle">Play Again?</p>
            <div className="game-over-phrase">
              <p>
                <strong>Spanish phrase:</strong> {currentPhrase?.spanishText ?? 'N/A'}
              </p>
              <p>
                <strong>Target translation:</strong> {currentEnglishText || 'N/A'}
              </p>
            </div>
            <div className="game-over-buttons">
              <button className="game-over-button game-over-button-yes" onClick={resetGame}>
                Yes
              </button>
              <button className="game-over-button game-over-button-no" onClick={redirectToEnglishCode}>
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
