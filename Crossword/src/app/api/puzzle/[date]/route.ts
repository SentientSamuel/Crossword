import { NextResponse } from "next/server"
import { resolveDailyPuzzle } from "@/lib/puzzles"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  context: { params: Promise<{ date: string }> }
) {
  const { date } = await context.params
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 })
  }

  const puzzle = resolveDailyPuzzle(date)
  if (!puzzle || puzzle.date !== date) {
    return NextResponse.json(
      { error: `No puzzle for ${date}.` },
      { status: 404 }
    )
  }

  return NextResponse.json({
    date: puzzle.date,
    meta: puzzle.meta,
    ipuz: puzzle.ipuz,
  })
}
