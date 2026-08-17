import { Skeleton } from '@/components/ui/skeleton'

export default function QuotationLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b">
        <div className="container flex h-14 items-center px-4">
          <Skeleton className="h-6 w-32" />
        </div>
      </header>
      <main className="flex-1 container px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </main>
    </div>
  )
}
