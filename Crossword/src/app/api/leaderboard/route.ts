import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { todayInChicago } from "@/lib/utils"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date") || todayInChicago()
  const db = getDb()

  const streaks = db
    .prepare(
      `SELECT username, streak FROM users
       WHERE streak > 0
       ORDER BY streak DESC, username ASC
       LIMIT 10`
    )
    .all() as { username: string; streak: number }[]

  const fastest = db
    .prepare(
      `SELECT u.username as username, s.time_ms as timeMs
       FROM daily_solves s
       JOIN users u ON u.id = s.user_id
       WHERE s.puzzle_date = ?
       ORDER BY s.time_ms ASC, u.username ASC
       LIMIT 10`
    )
    .all(date) as { username: string; timeMs: number }[]

  return NextResponse.json({ date, streaks, fastest })
}
