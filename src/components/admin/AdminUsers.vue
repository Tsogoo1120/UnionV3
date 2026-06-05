<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase.js'
import UiIcon from '@/components/common/UiIcon.vue'
import UiAvatar from '@/components/common/UiAvatar.vue'

const users = ref([])
const loading = ref(true)
const search = ref('')

const subChip = {
  active:   { c: 'good', t: 'Идэвхтэй' },
  pending:  { c: 'warn', t: 'Хүлээгдэж байна' },
  inactive: { c: '',     t: 'Идэвхгүй' },
  expired:  { c: 'bad',  t: 'Дуусгавар' },
  denied:   { c: 'bad',  t: 'Татгалзсан' },
}

async function loadUsers() {
  loading.value = true
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, role, subscription_status, subscription_expires_at, created_at')
    .order('created_at', { ascending: false })

  if (!error && data) users.value = data
  loading.value = false
}

onMounted(loadUsers)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter((u) =>
    (u.full_name ?? '').toLowerCase().includes(q) ||
    (u.email ?? '').toLowerCase().includes(q) ||
    (u.phone ?? '').toLowerCase().includes(q)
  )
})

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('mn-MN', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="scroll-y" style="flex: 1; overflow-y: auto; height: calc(100vh - 72px)">
    <div class="page-inset">
      <!-- search bar -->
      <div style="margin-bottom: 22px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap">
        <div style="position: relative; flex: 1; min-width: 220px">
          <UiIcon name="search" :size="16" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none" />
          <input
            v-model="search"
            placeholder="Нэр, имэйл, утасны дугаараар хайх…"
            style="width: 100%; padding: 10px 14px 10px 36px; border: 1px solid var(--line); border-radius: 10px; font-size: 14px; background: var(--card); color: var(--ink); box-sizing: border-box"
          />
        </div>
        <span class="chip" style="white-space: nowrap">{{ filtered.length }} хэрэглэгч</span>
      </div>

      <!-- loading -->
      <div v-if="loading" style="text-align: center; padding: 48px; color: var(--muted); font-size: 14px">
        <UiIcon name="clock" :size="24" style="display: block; margin: 0 auto 10px; opacity: 0.4" />
        Уншиж байна…
      </div>

      <!-- empty -->
      <div v-else-if="!filtered.length" style="text-align: center; padding: 48px; color: var(--muted); font-size: 14px">
        <UiIcon name="users" :size="24" style="display: block; margin: 0 auto 10px; opacity: 0.3" />
        Хэрэглэгч олдсонгүй
      </div>

      <!-- table -->
      <div v-else class="card" style="border-radius: 14px; overflow: hidden">
        <!-- header -->
        <div
          style="display: grid; grid-template-columns: 2fr 1.4fr 1.2fr 1fr 1fr; gap: 10px; padding: 10px 18px; background: var(--surface-2); border-bottom: 1px solid var(--line); font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em"
        >
          <div>Хэрэглэгч</div>
          <div>Имэйл</div>
          <div>Утас</div>
          <div>Статус</div>
          <div>Дуусах огноо</div>
        </div>

        <!-- rows -->
        <div
          v-for="(u, i) in filtered"
          :key="u.id"
          style="display: grid; grid-template-columns: 2fr 1.4fr 1.2fr 1fr 1fr; gap: 10px; padding: 13px 18px; align-items: center; font-size: 13.5px"
          :style="{ borderTop: i === 0 ? 'none' : '1px solid var(--line-soft)' }"
        >
          <!-- name + avatar -->
          <div class="flex items-center" style="gap: 11px; min-width: 0">
            <UiAvatar :name="u.full_name || u.email || '?'" :size="34" style="flex: none" />
            <div style="min-width: 0">
              <div style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">
                {{ u.full_name || '—' }}
              </div>
              <div v-if="u.role === 'admin'" style="font-size: 11px; color: var(--primary); font-weight: 600; margin-top: 1px">Admin</div>
            </div>
          </div>

          <!-- email -->
          <div style="color: var(--ink-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis">
            {{ u.email || '—' }}
          </div>

          <!-- phone -->
          <div style="color: var(--ink-soft)">
            {{ u.phone || '—' }}
          </div>

          <!-- subscription status -->
          <div>
            <span :class="'chip ' + (subChip[u.subscription_status]?.c || '')" style="font-size: 11.5px; padding: 3px 9px">
              {{ subChip[u.subscription_status]?.t || u.subscription_status }}
            </span>
          </div>

          <!-- expiry -->
          <div class="muted" style="font-size: 12.5px">
            {{ fmtDate(u.subscription_expires_at) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
