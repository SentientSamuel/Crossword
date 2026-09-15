"use client"

import { useCallback, useEffect, useState } from "react"
import { formatDuration } from "@/lib/utils"
import type { LeaderboardPayload } from "@/lib/types"

type LeaderboardProps = {
  date: string
  refreshKey: number
}

export function Leaderboard({ date, refreshKey }: LeaderboardProps) {
  const [data, setData] = useState<LeaderboardPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/leaderboard?date=${date}`)
      const json = await response.json()
      if (!response.ok) {
        throw new Error(json.error || "Could not load leaderboard.")
      }
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load leaderboard.")
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    void load()
  }, [load, refreshKey])

  return (
    <aside className="leaderboard-panel space-y-5">
      <div>
        <h2 className="font-display text-xl tracking-tight text-[var(--ink)]">
          Leaderboard
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Streaks and today&apos;s fastest finishes.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--ink-muted)]">Loading rankings…</p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {data ? (
        <div className="space-y-5">
          <section>
            <h3 className="mb-2 text-xs font-semibold tracking-[0.14em] text-[var(--ochre)] uppercase">
              Current streaks
            </h3>
            {data.streaks.length === 0 ? (
              <p className="text-sm text-[var(--ink-muted)]">
                No streaks yet — finish today&apos;s grid to open the board.
              </p>
            ) : (
              <ol className="space-y-1.5">
                {data.streaks.map((row, index) => (
                  <li
                    key={row.username}
                    className="flex items-baseline justify-between gap-3 border-b border-[var(--rule)] pb-1.5 text-sm"
                  >
                    <span>
                      <span className="mr-2 text-[var(--ink-muted)]">
                        {index + 1}.
                      </span>
                      {row.username}
                    </span>
                    <span className="font-mono text-[var(--ink)]">
                      {row.streak}d
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold tracking-[0.14em] text-[var(--ochre)] uppercase">
              Fastest · {date}
            </h3>
            {data.fastest.length === 0 ? (
              <p className="text-sm text-[var(--ink-muted)]">
                Nobody has logged a time for this puzzle yet.
              </p>
            ) : (
              <ol className="space-y-1.5">
                {data.fastest.map((row, index) => (
                  <li
                    key={`${row.username}-${row.timeMs}`}
                    className="flex items-baseline justify-between gap-3 border-b border-[var(--rule)] pb-1.5 text-sm"
                  >
                    <span>
                      <span className="mr-2 text-[var(--ink-muted)]">
                        {index + 1}.
                      </span>
                      {row.username}
                    </span>
                    <span className="font-mono text-[var(--ink)]">
                      {formatDuration(row.timeMs)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      ) : null}
    </aside>
  )
}
