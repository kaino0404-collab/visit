import type { Hospital } from '../types'

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

function normalize(name: string): string {
  return name.replace(/\s+/g, '').replace(/(병원|의원|클리닉|내과|외과|한의원)$/g, '').toLowerCase()
}

export function findBestMatch(query: string | null, hospitals: Hospital[]): Hospital | null {
  if (!query || hospitals.length === 0) return null

  const q = normalize(query)

  // 1. 정확히 일치
  const exact = hospitals.find(h => h.name === query)
  if (exact) return exact

  // 2. 정규화 후 정확히 일치
  const normExact = hospitals.find(h => normalize(h.name) === q)
  if (normExact) return normExact

  // 3. 포함 관계 (한쪽이 다른쪽을 포함)
  const contains = hospitals.find(h => {
    const hn = normalize(h.name)
    return hn.includes(q) || q.includes(hn)
  })
  if (contains) return contains

  // 4. 레벤슈타인 거리 2 이하
  let best: Hospital | null = null
  let bestDist = 3
  for (const h of hospitals) {
    const dist = levenshtein(normalize(h.name), q)
    if (dist < bestDist) {
      bestDist = dist
      best = h
    }
  }
  return best
}
