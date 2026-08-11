import { Header } from '@/components/header'
import { HomeDashboard } from '@/components/home-dashboard'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <HomeDashboard />
        </div>
      </main>
    </div>
  )
}