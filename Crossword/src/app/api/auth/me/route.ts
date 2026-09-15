import { NextResponse } from "next/server"
import { getUserById, readSession } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { todayInChicago } from "@/lib/utils"

export async function GET() {
  const session = await readSession()
  if (!session) {
    return NextResponse.json({ user: null })
  }

  const user = getUserById(session.sub)
  if (!user) {
    return NextResponse.json({ user: null })
  }

  const today = todayInChicago()
  const solvedToday = getDb()
    .prepare(
      `SELECT time_ms FROM daily_solves WHERE user_id = ? AND puzzle_date = ?`
    )
    .get(user.id, today) as { time_ms: number } | undefined

  return NextResponse.json({
    user,
    solvedToday: solvedToday
      ? { timeMs: solvedToday.time_ms }
      : null,
  })
}
