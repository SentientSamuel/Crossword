import { NextResponse } from "next/server"
import {
  createSessionToken,
  registerUser,
  setSessionCookie,
} from "@/lib/auth"
import { z } from "zod"

const schema = z.object({
  username: z.string().min(2).max(24),
  password: z.string().min(6).max(200),
})

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json())
    const user = await registerUser(body.username, body.password)
    const token = await createSessionToken(user)
    const response = NextResponse.json({ user })
    setSessionCookie(response, token)
    return response
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "Check your username and password."
        : error instanceof Error
          ? error.message
          : "Could not create account."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
