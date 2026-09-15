import fs from "fs"
import path from "path"
import { todayInChicago } from "@/lib/utils"
import type { IpuzPuzzle, PuzzleMeta } from "@/lib/types"

export type { IpuzPuzzle }

function puzzlesDir() {
  if (process.env.PUZZLES_DIR) {
    return process.env.PUZZLES_DIR
  }
  return path.join(process.cwd(), "puzzles")
}

export function listPuzzleDates(): string[] {
  const dir = puzzlesDir()
  if (!fs.existsSync(/*turbopackIgnore: true*/ dir)) return []
  return fs
    .readdirSync(/*turbopackIgnore: true*/ dir)
    .filter((f) => f.endsWith(".ipuz"))
    .map((f) => f.replace(/\.ipuz$/, ""))
    .sort()
}

export function loadPuzzleFile(date: string): IpuzPuzzle | null {
  const filePath = path.join(puzzlesDir(), `${date}.ipuz`)
  if (!fs.existsSync(/*turbopackIgnore: true*/ filePath)) return null
  const raw = fs.readFileSync(/*turbopackIgnore: true*/ filePath, "utf8")
  return JSON.parse(raw) as IpuzPuzzle
}

export function resolveDailyPuzzle(preferredDate?: string): {
  date: string
  ipuz: IpuzPuzzle
  meta: PuzzleMeta
} | null {
  const dates = listPuzzleDates()
  if (dates.length === 0) return null

  const wanted = preferredDate || todayInChicago()
  let date = wanted
  let isFallback = false

  if (!dates.includes(wanted)) {
    date = dates[dates.length - 1]
    isFallback = true
  }

  const ipuz = loadPuzzleFile(date)
  if (!ipuz) return null

  return {
    date,
    ipuz,
    meta: {
      date,
      title: ipuz.title || "Daily Crossword",
      author: ipuz.author || "Samuel Lamb",
      difficulty: ipuz.difficulty || "Intermediate",
      intro: ipuz.intro || "",
      isFallback,
    },
  }
}

export function countFilledErrors(
  solution: (string | null)[][],
  guesses: Record<string, string>
): { errors: number; filled: number; total: number } {
  let errors = 0
  let filled = 0
  let total = 0

  for (let r = 0; r < solution.length; r++) {
    for (let c = 0; c < solution[r].length; c++) {
      const answer = solution[r][c]
      if (!answer || answer === "#") continue
      total++
      const guess = guesses[`${r}:${c}`]
      if (!guess || guess === "" || guess === " ") continue
      filled++
      if (guess.toUpperCase() !== answer.toUpperCase()) {
        errors++
      }
    }
  }

  return { errors, filled, total }
}
