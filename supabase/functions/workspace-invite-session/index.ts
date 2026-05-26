import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

const normalizeUsername = (value: string) => String(value || '').trim().replace(/^@/, '').toLowerCase()
const normalizeInviteEmail = (value: string) => {
  const normalized = normalizeUsername(value)
  if (!normalized) return ''
  if (normalized.includes('@')) return normalized
  return `${normalized}.dyatask@gmail.com`
}
const buildInvitePassword = (username: string, token: string) => {
  const safeUsername = normalizeUsername(username) || 'assistant'
  return `DyaTaskInvite#${safeUsername}#${String(token || '').trim()}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum tersedia di Edge Function.')
    }

    const body = await req.json().catch(() => ({}))
    const inviteToken = String(body.inviteToken || '').trim()
    const requestedUsername = normalizeUsername(body.username || '')
    if (!inviteToken) throw new Error('Token invite wajib diisi.')

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data: inviteRow, error: inviteError } = await admin
      .from('workspace_members')
      .select('id, owner_user_id, member_email, role, permissions, status, member_user_id')
      .eq('invite_token', inviteToken)
      .maybeSingle()

    if (inviteError) throw inviteError
    if (!inviteRow?.id) throw new Error('Undangan tidak ditemukan.')
    if (!['pending', 'active'].includes(String(inviteRow.status || '').toLowerCase())) {
      throw new Error('Undangan tidak aktif.')
    }

    const username = requestedUsername
      || normalizeUsername(String(inviteRow.member_email || '').replace(/\.dyatask@gmail\.com$/i, ''))
      || `assistant-${inviteToken.slice(0, 8).toLowerCase()}`
    const email = String(inviteRow.member_email || '').trim().toLowerCase() || normalizeInviteEmail(username)
    const password = buildInvitePassword(username, inviteToken)

    let userId = inviteRow.member_user_id || ''
    if (!userId) {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: username }
      })

      if (createError) {
        const alreadyExists = /already|registered|exists/i.test(createError.message || '')
        if (!alreadyExists) throw createError

        for (let page = 1; page <= 10 && !userId; page += 1) {
          const { data: userList, error: listError } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
          if (listError) throw listError
          const match = userList?.users?.find((user) => String(user.email || '').toLowerCase() === email)
          if (match?.id) userId = match.id
          if (!userList?.users?.length || userList.users.length < 1000) break
        }
        if (!userId) throw createError

        const { error: updateUserError } = await admin.auth.admin.updateUserById(userId, {
          email_confirm: true,
          password,
          user_metadata: { full_name: username }
        })
        if (updateUserError) throw updateUserError
      } else {
        userId = created?.user?.id || ''
      }
    } else {
      const { error: updateUserError } = await admin.auth.admin.updateUserById(userId, {
        email_confirm: true,
        password,
        user_metadata: { full_name: username }
      })
      if (updateUserError) throw updateUserError
    }

    if (!userId) throw new Error('User assistant gagal dibuat.')

    const { data: existingMembership } = await admin
      .from('workspace_members')
      .select('id')
      .eq('owner_user_id', inviteRow.owner_user_id)
      .eq('member_user_id', userId)
      .neq('id', inviteRow.id)
      .maybeSingle()

    if (existingMembership?.id) {
      const { error: updateExistingError } = await admin
        .from('workspace_members')
        .update({
          status: 'active',
          role: inviteRow.role,
          permissions: inviteRow.permissions,
          accepted_at: new Date().toISOString()
        })
        .eq('id', existingMembership.id)
      if (updateExistingError) throw updateExistingError

      if (String(inviteRow.status || '').toLowerCase() === 'pending') {
        await admin.from('workspace_members').delete().eq('id', inviteRow.id)
      }
    } else {
      const { error: updateInviteError } = await admin
        .from('workspace_members')
        .update({
          member_user_id: userId,
          status: 'active',
          accepted_at: new Date().toISOString()
        })
        .eq('id', inviteRow.id)
      if (updateInviteError) throw updateInviteError
    }

    return new Response(JSON.stringify({ email, password }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
