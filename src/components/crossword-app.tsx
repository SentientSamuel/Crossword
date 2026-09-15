"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import Crossword, {
  useIpuz,
  type CrosswordImperative,
} from "@crosswordxyz/react-crossword"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AuthDialog } from "@/components/auth-dialog"
import { Leaderboard } from "@/components/leaderboard"
import { formatDuration } from "@/lib/utils"
import type {
  IpuzPuzzle,
  PuzzleMeta,
  SolveResult,
  UserPublic,
} from "@/lib/types"

type PuzzleResponse = {
  date: string
  meta: PuzzleMeta
  ipuz: IpuzPuzzle
}

const crosswordTheme = {
  columnBreakpoint: "900px",
  gridBackground: "transparent",
  cellBackground: "#f5faf7",
  cellBorder: "#16302b",
  textColor: "#16302b",
  numberColor: "#4d635c",
  focusBackground: "#e2b35a",
  highlightBackground: "#d5e8df",
}

type BoardProps = {
  ipuz: IpuzPuzzle
  date: string
  boardKey: number
  crosswordRef: React.RefObject<CrosswordImperative | null>
  onCellChange: (row: number, col: number, char: string) => void
  onCrosswordCorrect: (isCorrect: boolean) => void
}

function CrosswordBoard({
  ipuz,
  date,
  boardKey,
  crosswordRef,
  onCellChange,
  onCrosswordCorrect,
}: BoardProps) {
  const clues = useIpuz(ipuz)
  if (!clues) {
    return (
      <div className="state-panel" role="alert">
        <p className="state-title">Couldn&apos;t parse this IPUZ</p>
        <p className="state-copy">
          The puzzle file is present but isn&apos;t a supported crossword shape.
          Check the dated file in <code>puzzles/</code>.
        </p>
      </div>
    )
  }

  return (
    <div className="crossword-frame">
      <Crossword
        key={boardKey}
        ref={crosswordRef}
        data={clues}
        theme={crosswordTheme}
        storageKey={`lamb-${date}`}
        onCellChange={onCellChange}
        onCrosswordCorrect={onCrosswordCorrect}
      />
    </div>
  )
}

export function CrosswordApp() {
  const [puzzle, setPuzzle] = useState<PuzzleResponse | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserPublic | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [running, setRunning] = useState(false)
  const [solved, setSolved] = useState(false)
  const [checkOpen, setCheckOpen] = useState(false)
  const [checkMessage, setCheckMessage] = useState("")
  const [solveOpen, setSolveOpen] = useState(false)
  const [solveResult, setSolveResult] = useState<SolveResult | null>(null)
  const [solveNote, setSolveNote] = useState<string | null>(null)
  const [boardKey, setBoardKey] = useState(0)
  const [leaderboardKey, setLeaderboardKey] = useState(0)
  const [guesses, setGuesses] = useState<Record<string, string>>({})
  const crosswordRef = useRef<CrosswordImperative>(null)
  const startedAtRef = useRef<number | null>(null)
  const accumulatedRef = useRef(0)
  const saveAttemptedRef = useRef(false)
  const userRef = useRef<UserPublic | null>(null)
  userRef.current = user

  const loadPuzzle = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const response = await fetch("/api/puzzle/today")
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Could not load today's puzzle.")
      }
      setPuzzle(data)
      setGuesses({})
      setElapsedMs(0)
      setRunning(false)
      setSolved(false)
      setSolveResult(null)
      setSolveNote(null)
      startedAtRef.current = null
      accumulatedRef.current = 0
      saveAttemptedRef.current = false
      setBoardKey((k) => k + 1)
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Could not load today's puzzle."
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMe = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me")
      const data = await response.json()
      setUser(data.user ?? null)
      if (data.solvedToday?.timeMs) {
        setSolved(true)
        setElapsedMs(data.solvedToday.timeMs)
        setSolveNote("You already finished today's puzzle on this account.")
      }
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    void loadPuzzle()
    void loadMe()
  }, [loadPuzzle, loadMe])

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      if (startedAtRef.current == null) return
      setElapsedMs(accumulatedRef.current + (Date.now() - startedAtRef.current))
    }, 250)
    return () => window.clearInterval(id)
  }, [running])

  const startTimer = useCallback(() => {
    if (solved || running) return
    startedAtRef.current = Date.now()
    setRunning(true)
  }, [running, solved])

  const stopTimer = useCallback(() => {
    if (startedAtRef.current != null) {
      accumulatedRef.current += Date.now() - startedAtRef.current
      startedAtRef.current = null
    }
    setRunning(false)
    setElapsedMs(accumulatedRef.current)
    return accumulatedRef.current
  }, [])

  const persistSolve = useCallback(
    async (timeMs: number, signedIn: boolean) => {
      if (!puzzle) return
      if (!signedIn) {
        setSolveNote("Sign in to save this time and keep your streak.")
        setSolveOpen(true)
        setAuthOpen(true)
        return
      }
      if (saveAttemptedRef.current) return
      saveAttemptedRef.current = true
      try {
        const response = await fetch("/api/solve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            puzzleDate: puzzle.date,
            timeMs,
          }),
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || "Could not save solve.")
        }
        setSolveResult(data)
        setUser((prev) => (prev ? { ...prev, streak: data.streak } : prev))
        setLeaderboardKey((k) => k + 1)
        setSolveOpen(true)
      } catch (err) {
        setSolveNote(
          err instanceof Error ? err.message : "Could not save solve."
        )
        setSolveOpen(true)
        saveAttemptedRef.current = false
      }
    },
    [puzzle]
  )

  const handleCellChange = useCallback(
    (row: number, col: number, char: string) => {
      startTimer()
      setGuesses((prev) => {
        const key = `${row}:${col}`
        if (!char) {
          const next = { ...prev }
          delete next[key]
          return next
        }
        return { ...prev, [key]: char }
      })
    },
    [startTimer]
  )

  const handleCrosswordCorrect = useCallback(
    (isCorrect: boolean) => {
      if (!isCorrect || solved) return
      const timeMs = stopTimer()
      setSolved(true)
      void persistSolve(timeMs, Boolean(userRef.current))
    },
    [persistSolve, solved, stopTimer]
  )

  const handleCheck = useCallback(() => {
    if (!puzzle) return
    let errors = 0
    let filled = 0
    const solution = puzzle.ipuz.solution
    for (let r = 0; r < solution.length; r++) {
      for (let c = 0; c < solution[r].length; c++) {
        const answer = solution[r][c]
        if (!answer || answer === "#") continue
        const guess = guesses[`${r}:${c}`]
        if (!guess) continue
        filled++
        if (guess.toUpperCase() !== String(answer).toUpperCase()) {
          errors++
        }
      }
    }

    if (filled === 0) {
      setCheckMessage("No letters filled yet.")
    } else if (errors === 0) {
      setCheckMessage("0 errors in the letters you've entered.")
    } else if (errors === 1) {
      setCheckMessage("1 error")
    } else {
      setCheckMessage(`${errors} errors`)
    }
    setCheckOpen(true)
  }, [guesses, puzzle])

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
  }

  const statusLine = useMemo(() => {
    if (!puzzle) return ""
    if (puzzle.meta.isFallback) {
      return `Showing ${puzzle.date} (latest available puzzle).`
    }
    return puzzle.meta.intro
  }, [puzzle])

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand-block">
          <p className="brand-mark">Lamb Daily</p>
          <p className="brand-sub">Samuel Lamb&apos;s crossword</p>
        </div>
        <div className="header-actions">
          <div className="timer-chip" aria-live="polite">
            <span className="timer-label">Timer</span>
            <span className="timer-value font-mono">
              {formatDuration(elapsedMs)}
            </span>
          </div>
          {user ? (
            <div className="user-chip">
              <span>
                {user.username}
                <span className="streak"> · {user.streak}d streak</span>
              </span>
              <Button variant="outline" size="sm" onClick={() => void logout()}>
                Sign out
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => setAuthOpen(true)}>
              Sign in
            </Button>
          )}
        </div>
      </header>

      <main className="main-grid">
        <section className="play-panel">
          {loading ? (
            <div className="state-panel">
              <p className="state-title">Setting the grid…</p>
              <p className="state-copy">
                Fetching today&apos;s IPUZ and warming up the clues.
              </p>
            </div>
          ) : null}

          {loadError ? (
            <div className="state-panel" role="alert">
              <p className="state-title">Puzzle unavailable</p>
              <p className="state-copy">{loadError}</p>
              <Button className="mt-4" onClick={() => void loadPuzzle()}>
                Try again
              </Button>
            </div>
          ) : null}

          {!loading && !loadError && puzzle ? (
            <>
              <div className="puzzle-heading">
                <div>
                  <p className="puzzle-kicker">
                    {puzzle.meta.difficulty} · {puzzle.date}
                  </p>
                  <h1 className="puzzle-title">{puzzle.meta.title}</h1>
                  <p className="puzzle-byline">
                    by {puzzle.meta.author}
                    {statusLine ? ` — ${statusLine}` : null}
                  </p>
                </div>
                <div className="toolbar">
                  <Button variant="outline" onClick={handleCheck}>
                    Check
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      crosswordRef.current?.reset()
                      setGuesses({})
                      if (!solved) {
                        accumulatedRef.current = 0
                        startedAtRef.current = null
                        setElapsedMs(0)
                        setRunning(false)
                      }
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </div>

              {solved ? (
                <p className="solved-banner">
                  Solved in {formatDuration(elapsedMs)}
                  {solveResult
                    ? ` · streak ${solveResult.streak}`
                    : solveNote
                      ? ` · ${solveNote}`
                      : ""}
                </p>
              ) : null}

              <CrosswordBoard
                ipuz={puzzle.ipuz}
                date={puzzle.date}
                boardKey={boardKey}
                crosswordRef={crosswordRef}
                onCellChange={handleCellChange}
                onCrosswordCorrect={handleCrosswordCorrect}
              />
            </>
          ) : null}
        </section>

        <Leaderboard date={puzzle?.date || ""} refreshKey={leaderboardKey} />
      </main>

      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onAuthed={(next) => {
          setUser(next)
          if (solved && puzzle) {
            saveAttemptedRef.current = false
            void persistSolve(elapsedMs || accumulatedRef.current, true)
          }
        }}
      />

      <Dialog open={checkOpen} onOpenChange={setCheckOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check</DialogTitle>
            <DialogDescription className="text-base text-foreground">
              {checkMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>

      <Dialog open={solveOpen} onOpenChange={setSolveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grid complete</DialogTitle>
            <DialogDescription>
              {solveResult
                ? solveResult.alreadySolved
                  ? `Already on the board at ${formatDuration(solveResult.bestTimeMs)}. Streak holds at ${solveResult.streak}.`
                  : `Saved ${formatDuration(solveResult.timeMs)}. Streak is now ${solveResult.streak}.`
                : solveNote || "Nice work."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </div>
  )
}
