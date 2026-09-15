export type IpuzPuzzle = {
  version: string
  kind: string[]
  title?: string
  author?: string
  date?: string
  difficulty?: string
  intro?: string
  dimensions: { width: number; height: number }
  puzzle: unknown[][]
  solution: (string | null)[][]
  clues: Record<"Across" | "Down", [number, string][]>
}

export type PuzzleMeta = {
  date: string
  title: string
  author: string
  difficulty: string
  intro: string
  isFallback: boolean
}

export type UserPublic = {
  id: string
  username: string
  streak: number
}

export type LeaderboardPayload = {
  date: string
  streaks: { username: string; streak: number }[]
  fastest: { username: string; timeMs: number }[]
}

export type SolveResult = {
  timeMs: number
  streak: number
  alreadySolved: boolean
  bestTimeMs: number
}
