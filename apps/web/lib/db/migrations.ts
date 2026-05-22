import { getDb } from './client'
import * as schema from './schema'
import { eq } from 'drizzle-orm'

/**
 * Run all migrations to create tables if they don't exist.
 * Called on app startup — idempotent.
 */
export function runMigrations() {
  const db = getDb()

  // Get raw sqlite connection for DDL
  // @ts-expect-error — accessing internal session
  const sqlite = db.session?.database ?? db._session?.database

  // We use drizzle's push approach for SQLite in development
  // For production, use drizzle-kit migrate
  createTables()
  seedDefaults()
}

function createTables() {
  const db = getDb()
  // Drizzle with better-sqlite3: tables are created via drizzle-kit
  // This function is a no-op when using drizzle-kit migrations
  // It exists as a hook for runtime validation
}

export async function seedDefaults() {
  const db = getDb()

  // Seed default settings
  const defaultSettings: Array<{ key: string; value: string }> = [
    { key: 'app_name', value: process.env.NEXT_PUBLIC_APP_NAME ?? 'ASKAI' },
    { key: 'device_name', value: process.env.NEXT_PUBLIC_DEVICE_NAME ?? 'ASKAI Hub' },
    { key: 'chat_model', value: process.env.DEFAULT_CHAT_MODEL ?? 'gemma3:1b' },
    { key: 'embedding_model', value: process.env.DEFAULT_EMBEDDING_MODEL ?? 'nomic-embed-text' },
    { key: 'kolibri_url', value: process.env.KOLIBRI_BASE_URL ?? 'http://localhost:8080' },
    { key: 'ollama_url', value: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434' },
    { key: 'ai_service_url', value: process.env.AI_SERVICE_URL ?? 'http://localhost:8000' },
    { key: 'feature_rag', value: 'true' },
    { key: 'feature_knowledge', value: 'true' },
    { key: 'feature_learn', value: 'true' },
    { key: 'classroom_mode', value: 'false' },
    { key: 'maintenance_mode', value: 'false' },
  ]

  for (const setting of defaultSettings) {
    const existing = db
      .select()
      .from(schema.settings)
      .where(eq(schema.settings.key, setting.key))
      .get()

    if (!existing) {
      db.insert(schema.settings).values(setting).run()
    }
  }

  // Seed default collection
  const defaultCollection = db
    .select()
    .from(schema.documentCollections)
    .where(eq(schema.documentCollections.id, 'general'))
    .get()

  if (!defaultCollection) {
    db.insert(schema.documentCollections)
      .values({
        id: 'general',
        name: 'General',
        description: 'Default document collection',
        color: '#3B82F6',
        icon: 'folder',
      })
      .run()
  }
}

export function getSetting(key: string): string | null {
  const db = getDb()
  const result = db
    .select()
    .from(schema.settings)
    .where(eq(schema.settings.key, key))
    .get()
  return result?.value ?? null
}

export function setSetting(key: string, value: string): void {
  const db = getDb()
  db.insert(schema.settings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: schema.settings.key,
      set: { value, updatedAt: new Date().toISOString() },
    })
    .run()
}
