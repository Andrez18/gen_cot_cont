import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b">
        <div className="container flex h-14 items-center px-4">
          <Skeleton className="h-6 w-32" />
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4 max-w-2xl">
        <Skeleton className="h-8 w-36 mb-6" />
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </main>
    </div>
  )
}
