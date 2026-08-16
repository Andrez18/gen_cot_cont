import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// El usuario cancela su propia suscripción. Se valida su token y se
// llama a la función SQL cancel_own_subscription(), que solo puede
// tocar la fila del propio usuario (auth.uid()) y solo si está 'active'.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { error } = await supabase.rpc('cancel_own_subscription')

  if (error) {
    if (error.message?.includes('NO_ACTIVE_SUBSCRIPTION')) {
      return NextResponse.json({ error: 'No tienes una suscripción activa para cancelar' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
