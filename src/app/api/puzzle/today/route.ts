import { NextResponse } from "next/server"
import { resolveDailyPuzzle } from "@/lib/puzzles"

export const dynamic = "force-dynamic"

export async function GET() {
  const puzzle = resolveDailyPuzzle()
  if (!puzzle) {
    return NextResponse.json(
      {
        error:
          "No puzzles found. Drop dated .ipuz files into the puzzles directory.",
      },
      { status: 404 }
    )
  }

  return NextResponse.json({
    date: puzzle.date,
    meta: puzzle.meta,
    ipuz: puzzle.ipuz,
  })
}
