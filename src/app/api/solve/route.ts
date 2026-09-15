import { NextResponse } from "next/server"
import { readSession, recordSolve } from "@/lib/auth"
import { z } from "zod"

const schema = z.object({
  puzzleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeMs: z.number().int().positive().max(24 * 60 * 60 * 1000),
})

export async function POST(request: Request) {
  const session = await readSession()
  if (!session) {
    return NextResponse.json(
      { error: "Sign in to save your time and streak." },
      { status: 401 }
    )
  }

  try {
    const body = schema.parse(await request.json())
    const result = recordSolve(session.sub, body.puzzleDate, body.timeMs)
    return NextResponse.json(result)
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "Invalid solve payload."
        : error instanceof Error
          ? error.message
          : "Could not save solve."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
