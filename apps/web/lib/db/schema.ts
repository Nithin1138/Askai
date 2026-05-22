import { sql } from 'drizzle-orm'
import {
  integer,
  real,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'

// ─── Admin Users ──────────────────────────────────────────────────────────────
export const adminUsers = sqliteTable('admin_users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
})

// ─── Document Collections ─────────────────────────────────────────────────────
export const documentCollections = sqliteTable('document_collections', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').notNull().default('#3B82F6'),
  icon: text('icon').notNull().default('folder'),
  documentCount: integer('document_count').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
})

// ─── Documents ────────────────────────────────────────────────────────────────
export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  status: text('status', {
    enum: ['pending', 'processing', 'ready', 'error'],
  })
    .notNull()
    .default('pending'),
  collectionId: text('collection_id').references(() => documentCollections.id, {
    onDelete: 'set null',
  }),
  chunkCount: integer('chunk_count').notNull().default(0),
  ingestedAt: text('ingested_at'),
  errorMessage: text('error_message'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
})

// ─── Document Chunks ──────────────────────────────────────────────────────────
export const documentChunks = sqliteTable('document_chunks', {
  id: text('id').primaryKey(),
  documentId: text('document_id')
    .notNull()
    .references(() => documents.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  chunkIndex: integer('chunk_index').notNull(),
  embeddingId: text('embedding_id'),
  metadata: text('metadata'), // JSON string
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
})

// ─── Chat Sessions ────────────────────────────────────────────────────────────
export const chatSessions = sqliteTable('chat_sessions', {
  id: text('id').primaryKey(),
  title: text('title').notNull().default('New conversation'),
  model: text('model').notNull().default('gemma3:1b'),
  messageCount: integer('message_count').notNull().default(0),
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
})

// ─── Chat Messages ────────────────────────────────────────────────────────────
export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => chatSessions.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
  content: text('content').notNull(),
  sources: text('sources'), // JSON array of source citations
  tokensUsed: integer('tokens_used'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
})

// ─── Active Sessions ──────────────────────────────────────────────────────────
export const activeSessions = sqliteTable('active_sessions', {
  id: text('id').primaryKey(),
  ip: text('ip').notNull(),
  userAgent: text('user_agent'),
  lastSeen: text('last_seen').notNull().default(sql`(datetime('now'))`),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
})

// ─── Request Logs ─────────────────────────────────────────────────────────────
export const requestLogs = sqliteTable('request_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  path: text('path').notNull(),
  method: text('method').notNull(),
  statusCode: integer('status_code').notNull(),
  durationMs: real('duration_ms'),
  ip: text('ip'),
  userAgent: text('user_agent'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
})

// ─── System Events ────────────────────────────────────────────────────────────
export const systemEvents = sqliteTable('system_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(),
  payload: text('payload'), // JSON
  severity: text('severity', { enum: ['info', 'warning', 'error'] })
    .notNull()
    .default('info'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
})

// ─── Settings ─────────────────────────────────────────────────────────────────
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
})

// ─── Types ────────────────────────────────────────────────────────────────────
export type AdminUser = typeof adminUsers.$inferSelect
export type DocumentCollection = typeof documentCollections.$inferSelect
export type Document = typeof documents.$inferSelect
export type DocumentChunk = typeof documentChunks.$inferSelect
export type ChatSession = typeof chatSessions.$inferSelect
export type ChatMessage = typeof chatMessages.$inferSelect
export type ActiveSession = typeof activeSessions.$inferSelect
export type RequestLog = typeof requestLogs.$inferSelect
export type SystemEvent = typeof systemEvents.$inferSelect
export type Setting = typeof settings.$inferSelect
