export function sanitizeWord(word) {
  if (!word) return ''
  return word.toString().replace(/[^\w]/g, '').toLowerCase()
}

export function normalizeWords(words = []) {
  return words.map(sanitizeWord).filter(Boolean)
}
