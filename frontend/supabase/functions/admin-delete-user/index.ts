// supabase/functions/admin-delete-user/index.ts
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
} as const

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  if (!supabaseUrl || !serviceKey || !anonKey) return json(500, { error: 'Service not configured' })

  // Admin client (DB + admin auth ops)
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  // Authed client (to read the caller from JWT)
  const authed = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    auth: { persistSession: false },
  })

  try {
    // 0) AuthN: caller must be signed in
    const { data: userRes, error: userErr } = await authed.auth.getUser()
    if (userErr || !userRes?.user) return json(401, { error: 'Unauthorized' })
    const callerId = userRes.user.id

    // 1) AuthZ: caller must be admin
    const { data: me, error: meErr } = await admin
      .from('profiles')
      .select('role, clinic_id')
      .eq('id', callerId)
      .single()

    if (meErr) return json(500, { error: meErr.message })
    if (!me || me.role !== 'admin') return json(403, { error: 'Admins only' })

    // 2) Parse input
    const { user_id, enforceSameClinic = true } = await req.json()
    if (!user_id) return json(400, { error: 'user_id is required' })
    if (user_id === callerId) return json(400, { error: 'Cannot delete yourself' })

    // (Optional) enforce same clinic
    if (enforceSameClinic) {
      const { data: target, error: targetErr } = await admin
        .from('profiles')
        .select('clinic_id')
        .eq('id', user_id)
        .single()

      if (targetErr) return json(400, { error: targetErr.message })
      if (!target || target.clinic_id !== me.clinic_id) {
        return json(403, { error: 'Cross-clinic delete not allowed' })
      }
    }

    // 3) Delete profile first (avoid FK error), then auth user
    await admin.from('profiles').delete().eq('id', user_id)

    const { error: delErr } = await admin.auth.admin.deleteUser(user_id)
    if (delErr) return json(400, { error: delErr.message })

    return json(200, { message: 'User deleted', user_id })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return json(500, { error: msg })
  }
})
