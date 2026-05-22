import { NextResponse } from 'next/server'
import { getAIProvider } from '@/lib/ai/provider'
import { requireAdmin } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdmin()
    const provider = getAIProvider()
    const [models, available] = await Promise.all([
      provider.listModels(),
      provider.isAvailable(),
    ])

    return NextResponse.json({ models, available })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ models: [], available: false, error: 'Failed to fetch models' })
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin()
    const { name } = await req.json()
    if (!name) return NextResponse.json({ error: 'Model name required' }, { status: 400 })

    const provider = getAIProvider()
    await provider.pullModel(name)

    return NextResponse.json({ success: true, message: `Pull started for ${name}` })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to pull model' }, { status: 500 })
  }
}
