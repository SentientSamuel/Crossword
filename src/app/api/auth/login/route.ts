import { NextResponse } from "next/server"
import {
  createSessionToken,
  getUserByUsername,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth"
import { z } from "zod"

const schema = z.object({
  username: z.string().min(2).max(24),
  password: z.string().min(6).max(200),
})

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json())
    const user = getUserByUsername(body.username)
    if (!user || !(await verifyPassword(body.password, user.password_hash))) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      )
    }

    const token = await createSessionToken(user)
    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        streak: user.streak,
      },
    })
    setSessionCookie(response, token)
    return response
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "Check your username and password."
        : error instanceof Error
          ? error.message
          : "Login failed."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
