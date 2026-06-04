import { ref, readonly } from 'vue'
import { supabase } from '@/lib/supabase.js'

const session = ref(null)
const profile = ref(null)
const loading = ref(true)

let initialized = false

async function fetchProfile(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  profile.value = data
}

async function init() {
  if (initialized) return
  initialized = true

  const {
    data: { session: s },
  } = await supabase.auth.getSession()
  session.value = s
  if (s) await fetchProfile(s.user.id)
  loading.value = false

  supabase.auth.onAuthStateChange(async (event, s) => {
    session.value = s
    if (s) {
      await fetchProfile(s.user.id)
      if (event === 'SIGNED_IN') {
        const createdMs = new Date(s.user.created_at).getTime()
        const lastMs = new Date(s.user.last_sign_in_at).getTime()
        if (Math.abs(createdMs - lastMs) < 10_000) {
          supabase.functions
            .invoke('send-email', { body: { type: 'welcome', userId: s.user.id } })
            .catch(() => {})
        }
      }
    } else {
      profile.value = null
    }
  })
}

async function signInWithGoogle(redirectTo) {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo ?? window.location.origin,
    },
  })
}

async function signOut() {
  await supabase.auth.signOut()
  session.value = null
  profile.value = null
}

async function updateProfile(data) {
  if (!session.value) return { error: 'Not authenticated' }
  const { error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', session.value.user.id)
  if (!error) await fetchProfile(session.value.user.id)
  return { error }
}

export function useAuth() {
  return {
    session: readonly(session),
    profile: readonly(profile),
    loading: readonly(loading),
    init,
    fetchProfile,
    signInWithGoogle,
    signOut,
    updateProfile,
  }
}
