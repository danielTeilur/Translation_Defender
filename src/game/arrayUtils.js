export function shuffleArray(items = []) {
  const working = Array.isArray(items) ? [...items] : []
  for (let i = working.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[working[i], working[j]] = [working[j], working[i]]
  }
  return working
}

export function sampleArray(items = [], count = 0) {
  if (!Array.isArray(items) || items.length === 0 || count <= 0) {
    return []
  }

  const working = shuffleArray(items)
  return working.slice(0, Math.min(count, working.length))
}
