import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { getDb } from "@/lib/db"
import type { UserPublic } from "@/lib/types"

const COOKIE_NAME = "lamb_session"
const SESSION_DAYS = 30

function getSecret() {
  const secret = process.env.AUTH_SECRET || "lamb-daily-dev-secret-change-me"
  return new TextEncoder().encode(secret)
}

export type SessionPayload = {
  sub: string
  username: string
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export async function createSessionToken(user: { id: string; username: string }) {
  return new SignJWT({ username: user.username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret())
}

export async function readSession(): Promise<SessionPayload | null> {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (!payload.sub || typeof payload.username !== "string") return null
    return { sub: payload.sub, username: payload.username }
  } catch {
    return null
  }
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  })
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
}

export function getUserById(id: string): UserPublic | null {
  const row = getDb()
    .prepare(
      `SELECT id, username, streak FROM users WHERE id = ?`
    )
    .get(id) as { id: string; username: string; streak: number } | undefined
  if (!row) return null
  return { id: row.id, username: row.username, streak: row.streak }
}

export function getUserByUsername(username: string) {
  return getDb()
    .prepare(
      `SELECT id, username, password_hash, streak, last_solve_date
       FROM users WHERE username = ? COLLATE NOCASE`
    )
    .get(username) as
    | {
        id: string
        username: string
        password_hash: string
        streak: number
        last_solve_date: string | null
      }
    | undefined
}

export async function registerUser(username: string, password: string) {
  const existing = getUserByUsername(username)
  if (existing) {
    throw new Error("That username is taken.")
  }
  if (username.length < 2 || username.length > 24) {
    throw new Error("Username must be 2–24 characters.")
  }
  if (!/^[a-zA-Z0-9_\-.]+$/.test(username)) {
    throw new Error("Username may use letters, numbers, _ - . only.")
  }
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.")
  }

  const id = randomUUID()
  const passwordHash = await hashPassword(password)
  getDb()
    .prepare(
      `INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)`
    )
    .run(id, username, passwordHash)

  return getUserById(id)!
}

export function previousCalendarDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() - 1)
  return dt.toISOString().slice(0, 10)
}

export function recordSolve(userId: string, puzzleDate: string, timeMs: number) {
  const db = getDb()
  const existing = db
    .prepare(
      `SELECT id, time_ms FROM daily_solves WHERE user_id = ? AND puzzle_date = ?`
    )
    .get(userId, puzzleDate) as { id: string; time_ms: number } | undefined

  if (existing) {
    const user = getUserById(userId)!
    return {
      timeMs: existing.time_ms,
      streak: user.streak,
      alreadySolved: true,
      bestTimeMs: existing.time_ms,
    }
  }

  const user = db
    .prepare(`SELECT streak, last_solve_date FROM users WHERE id = ?`)
    .get(userId) as { streak: number; last_solve_date: string | null }

  let nextStreak = 1
  if (user.last_solve_date === puzzleDate) {
    nextStreak = user.streak
  } else if (user.last_solve_date === previousCalendarDay(puzzleDate)) {
    nextStreak = user.streak + 1
  }

  const solveId = randomUUID()
  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO daily_solves (id, user_id, puzzle_date, time_ms)
       VALUES (?, ?, ?, ?)`
    ).run(solveId, userId, puzzleDate, timeMs)
    db.prepare(
      `UPDATE users SET streak = ?, last_solve_date = ? WHERE id = ?`
    ).run(nextStreak, puzzleDate, userId)
  })
  tx()

  return {
    timeMs,
    streak: nextStreak,
    alreadySolved: false,
    bestTimeMs: timeMs,
  }
}
