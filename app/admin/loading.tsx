import { Skeleton } from '@/components/ui/skeleton'

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <Skeleton className="h-8 w-48 mb-8 bg-white/10" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 rounded-xl bg-white/5" />
          <Skeleton className="h-24 rounded-xl bg-white/5" />
          <Skeleton className="h-24 rounded-xl bg-white/5" />
        </div>
        <Skeleton className="h-64 rounded-xl bg-white/5 mt-6" />
      </div>
    </div>
  )
}
