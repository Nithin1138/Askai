import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/auth/session'
import { getDb } from '@/lib/db/client'
import * as schema from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { withLogging, logSystemEvent } from '@/lib/db/logs'

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export const POST = withLogging(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const { username, password } = loginSchema.parse(body)

    const db = getDb()

    // Find admin user in DB first
    let adminUser: typeof schema.adminUsers.$inferSelect | undefined = db
      .select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.username, username))
      .get()

    // If no admin in DB, check env-based credentials (first-run bootstrap)
    if (!adminUser) {
      const envUsername = process.env.ADMIN_USERNAME ?? 'admin'
      const envHashedPassword =
        process.env.ADMIN_PASSWORD_HASH ??
        '$2b$10$1BMjEZBz/.cbo08X8aM0m.5wbM6ZUZnrR1cZ1dkN6XMWN2iA.hu/C' // hash of "askai123"

      if (username === envUsername) {
        const valid = await bcrypt.compare(password, envHashedPassword)
        if (valid) {
          // Create admin user on first login
          db.insert(schema.adminUsers)
            .values({ username, passwordHash: envHashedPassword })
            .run()

          adminUser = db
            .select()
            .from(schema.adminUsers)
            .where(eq(schema.adminUsers.username, username))
            .get()
        }
      }
    } else {
      const valid = await bcrypt.compare(password, adminUser.passwordHash)
      if (!valid) adminUser = undefined
    }

    if (!adminUser) {
      // Consistent timing to prevent timing attacks
      await bcrypt.compare('dummy', '$2b$10$invalidhash.placeholder.string.here')
      logSystemEvent({
        type: 'admin_login',
        payload: { username, status: 'failed', reason: 'Invalid credentials' },
        severity: 'warning',
      })
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const session = await getSession()
    session.isAdmin = true
    session.adminId = adminUser.id
    session.username = adminUser.username
    await session.save()

    logSystemEvent({
      type: 'admin_login',
      payload: { username: adminUser.username, status: 'success' },
      severity: 'info',
    })

    return NextResponse.json({ success: true, username: adminUser.username })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    console.error('Login error:', error)
    logSystemEvent({
      type: 'admin_login_error',
      payload: { error: error instanceof Error ? error.message : 'Unknown error' },
      severity: 'error',
    })
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
})

