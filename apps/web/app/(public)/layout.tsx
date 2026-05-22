import { TopBar } from '@/components/layout/top-bar'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--background))]">
      <TopBar />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  )
}
