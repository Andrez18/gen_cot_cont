import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase-admin'

const DAYS_BACK = 30

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10) // YYYY-MM-DD
}

function lastNDays(n: number) {
  const days: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    days.push(dateKey(d))
  }
  return days
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const supabaseAdmin = createAdminClient()
  const sinceIso = new Date(Date.now() - DAYS_BACK * 24 * 60 * 60 * 1000).toISOString()

  const [
    usersRes,
    subsRes,
    paymentsRes,
    discountCodesRes,
    quotationsCountRes,
    invoicesCountRes,
    expensesCountRes,
  ] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    supabaseAdmin.from('subscriptions').select('user_id, status, current_period_end'),
    supabaseAdmin
      .from('payment_requests')
      .select('id, amount, final_amount, status, created_at, reviewed_at')
      .order('created_at', { ascending: false }),
    supabaseAdmin.from('discount_codes').select('code, times_used, active').order('times_used', { ascending: false }),
    supabaseAdmin.from('quotations').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('invoices').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('expense_records').select('id', { count: 'exact', head: true }),
  ])

  if (usersRes.error) return NextResponse.json({ error: usersRes.error.message }, { status: 500 })

  const users = usersRes.data.users
  const totalUsers = users.length

  const days = lastNDays(DAYS_BACK)
  const signupsByDayMap = new Map<string, number>(days.map((d) => [d, 0]))
  for (const u of users) {
    const key = dateKey(new Date(u.created_at))
    if (signupsByDayMap.has(key)) signupsByDayMap.set(key, (signupsByDayMap.get(key) ?? 0) + 1)
  }
  const newUsersLast30d = [...signupsByDayMap.values()].reduce((a, b) => a + b, 0)
  const newUsersLast7d = days.slice(-7).reduce((sum, d) => sum + (signupsByDayMap.get(d) ?? 0), 0)

  const subscriptions = subsRes.data ?? []
  const now = new Date()
  const activeSubscriptions = subscriptions.filter(
    (s) => s.status === 'active' && (!s.current_period_end || new Date(s.current_period_end) > now)
  ).length
  const canceledSubscriptions = subscriptions.filter((s) => s.status === 'canceled').length

  const payments = paymentsRes.data ?? []
  const pendingPayments = payments.filter((p) => p.status === 'pending')
  const approvedPayments = payments.filter((p) => p.status === 'approved')
  const rejectedCount = payments.filter((p) => p.status === 'rejected').length

  const totalRevenue = approvedPayments.reduce((sum, p) => sum + (p.final_amount ?? p.amount ?? 0), 0)

  const revenueByDayMap = new Map<string, number>(days.map((d) => [d, 0]))
  for (const p of approvedPayments) {
    const key = dateKey(new Date(p.reviewed_at ?? p.created_at))
    if (revenueByDayMap.has(key)) {
      revenueByDayMap.set(key, (revenueByDayMap.get(key) ?? 0) + (p.final_amount ?? p.amount ?? 0))
    }
  }
  const revenueLast30d = [...revenueByDayMap.values()].reduce((a, b) => a + b, 0)
  const revenueThisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const revenueThisMonth = approvedPayments
    .filter((p) => new Date(p.reviewed_at ?? p.created_at) >= revenueThisMonthStart)
    .reduce((sum, p) => sum + (p.final_amount ?? p.amount ?? 0), 0)

  const activeDiscountCodes = (discountCodesRes.data ?? []).filter((c) => c.active).length
  const topDiscountCodes = (discountCodesRes.data ?? []).slice(0, 5)

  const chart = days.map((d) => ({
    date: d,
    signups: signupsByDayMap.get(d) ?? 0,
    revenue: revenueByDayMap.get(d) ?? 0,
  }))

  return NextResponse.json({
    totals: {
      totalUsers,
      newUsersLast7d,
      newUsersLast30d,
      activeSubscriptions,
      canceledSubscriptions,
      pendingPayments: pendingPayments.length,
      rejectedCount,
      totalRevenue,
      revenueLast30d,
      revenueThisMonth,
      activeDiscountCodes,
      totalDiscountCodes: (discountCodesRes.data ?? []).length,
      totalQuotations: quotationsCountRes.count ?? 0,
      totalInvoices: invoicesCountRes.count ?? 0,
      totalExpenseRecords: expensesCountRes.count ?? 0,
    },
    chart,
    topDiscountCodes,
    recentUsers: [...users]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((u) => ({
        id: u.id,
        email: u.email,
        full_name: (u.user_metadata as { full_name?: string } | null)?.full_name ?? null,
        created_at: u.created_at,
      })),
  })
}
