// supabase/functions/create-user/index.ts
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!supabaseUrl || !serviceKey) return json(500, { error: 'Service not configured' })

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  try {
    const { email, password, full_name, role, clinic_id } = await req.json()

    const problems: string[] = []
    if (!email) problems.push('email is required')
    if (!password || password.length < 8) problems.push('password must be at least 8 characters')
    if (!role) problems.push('role is required')
    if (!clinic_id) problems.push('clinic_id is required')
    if (problems.length) return json(400, { error: problems.join(', ') })

    // 1) Create auth user
    const { data: createRes, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role, clinic_id },
    })
    if (authError || !createRes?.user) {
      return json(400, { error: authError?.message ?? 'Failed to create auth user' })
    }
    const userId = createRes.user.id

    // 2) Upsert profile (works with/without the default "handle_new_user" trigger)
    const profileRow = { id: userId, email, full_name, role, clinic_id }
    const { error: upsertError } = await admin
      .from('profiles')
      .upsert(profileRow, { onConflict: 'id' }) // update if stub row already exists
    if (upsertError) {
      // Roll back safely: delete profile (if exists) first, then auth user
      await admin.from('profiles').delete().eq('id', userId)
      await admin.auth.admin.deleteUser(userId)
      return json(400, { error: upsertError.message })
    }

    return json(200, { message: 'User created', user_id: userId })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return json(500, { error: msg })
  }
})
