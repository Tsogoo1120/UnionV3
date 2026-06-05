<script setup>
import { ref, reactive, onMounted } from 'vue'
import UiIcon from '@/components/common/UiIcon.vue'
import { supabase } from '@/lib/supabase.js'

const avail = ref(true)
const appts = []
const showSetAvail = ref(false)

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
const HH = 58
const windows = reactive({})

const HOUR_OPTS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]

const modalDay = ref('Mon')
const modalStart = ref(9)
const modalEnd = ref(17)

async function loadAvailability() {
  const { data } = await supabase.from('mentor_availability').select('day, start_hour, end_hour')
  if (data) {
    for (const row of data) windows[row.day] = [row.start_hour, row.end_hour]
  }
}

function openModal() {
  modalDay.value = 'Mon'
  modalStart.value = 9
  modalEnd.value = 17
  showSetAvail.value = true
}

async function saveAvail() {
  if (modalEnd.value <= modalStart.value) return
  windows[modalDay.value] = [modalStart.value, modalEnd.value]
  showSetAvail.value = false
  await supabase.from('mentor_availability').upsert({
    day: modalDay.value,
    start_hour: modalStart.value,
    end_hour: modalEnd.value,
  })
}

async function clearAvail(day) {
  delete windows[day]
  await supabase.from('mentor_availability').delete().eq('day', day)
}

onMounted(loadAvailability)

const dayOf = (a) => a.date.split(' ')[0]
const startH = (a) => parseInt(a.time.split(':')[0]) + (a.time.split(':')[1] === '30' ? 0.5 : 0)
const apptsFor = (d) => appts.filter((a) => dayOf(a) === d)

function fmt(h) {
  return h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`
}
</script>

<template>
  <div class="flex flex-col" style="flex: 1; height: calc(100vh - 72px)">
    <div
      class="topbar-row flex-wrap"
      style="padding: 16px 36px; border-bottom: 1px solid var(--line); background: var(--card)"
    >
      <div class="flex items-center" style="gap: 16px">
        <button class="btn btn-ghost btn-sm" style="padding: 9px"><UiIcon name="chevLeft" :size="17" /></button>
        <div style="font-weight: 600; font-size: 15.5px">Jun 1 – 5, 2026</div>
        <button class="btn btn-ghost btn-sm" style="padding: 9px"><UiIcon name="chevRight" :size="17" /></button>
      </div>
      <div class="flex items-center" style="gap: 12px">
        <button
          class="flex items-center"
          style="gap: 8px; background: none; border: none; cursor: pointer; font-size: 13.5px; font-weight: 600; color: var(--ink-soft)"
          @click="avail = !avail"
        >
          <span :style="{ width: '38px', height: '22px', borderRadius: '999px', background: avail ? 'var(--sage-deep)' : 'var(--surface-3)', position: 'relative', transition: 'background .2s' }">
            <span :style="{ position: 'absolute', top: '2px', left: avail ? '18px' : '2px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left .2s' }" />
          </span>
          Show availability
        </button>
        <button class="btn btn-primary btn-sm" @click="openModal"><UiIcon name="plus" :size="16" /> Set availability</button>
      </div>
    </div>

    <div class="scroll-y schedule-scroll" style="flex: 1; overflow-y: auto">
      <div style="display: grid; grid-template-columns: 64px repeat(5, 1fr); min-width: 720px">
        <!-- header row -->
        <div style="border-bottom: 1px solid var(--line); border-right: 1px solid var(--line); position: sticky; top: 0; background: var(--surface); z-index: 3" />
        <div
          v-for="(d, i) in DAYS"
          :key="d"
          style="padding: 12px 0; text-align: center; border-bottom: 1px solid var(--line); border-right: 1px solid var(--line); position: sticky; top: 0; background: var(--surface); z-index: 3"
        >
          <div class="muted" style="font-size: 12px; font-weight: 600">{{ d }}</div>
          <div style="font-family: var(--serif); font-weight: 700; font-size: 19px">{{ i + 1 }}</div>
          <button
            v-if="windows[d]"
            class="btn btn-quiet"
            style="font-size: 11px; padding: 2px 7px; margin-top: 4px; color: var(--sage-deep)"
            @click="clearAvail(d)"
          >
            {{ windows[d][0] }}–{{ windows[d][1] }}h ×
          </button>
        </div>

        <!-- time gutter -->
        <div style="border-right: 1px solid var(--line)">
          <div v-for="h in HOURS" :key="h" :style="{ height: HH + 'px', position: 'relative' }">
            <span style="position: absolute; top: -8px; right: 8px; font-size: 11.5px; color: var(--faint)">{{ h }}:00</span>
          </div>
        </div>

        <!-- day columns -->
        <div v-for="d in DAYS" :key="d" style="border-right: 1px solid var(--line); position: relative">
          <div v-for="h in HOURS" :key="h" :style="{ height: HH + 'px', borderBottom: '1px solid var(--line-soft)' }" />
          <!-- availability band -->
          <div
            v-if="avail && windows[d]"
            :style="{
              position: 'absolute',
              left: '4px',
              right: '4px',
              top: (windows[d][0] - 8) * HH + 'px',
              height: (windows[d][1] - windows[d][0]) * HH + 'px',
              background: 'repeating-linear-gradient(135deg, var(--sage-tint), var(--sage-tint) 9px, transparent 9px, transparent 18px)',
              borderRadius: '8px',
              border: '1px dashed var(--sage)',
              opacity: 0.8,
              pointerEvents: 'none',
            }"
          />
          <!-- appointments -->
          <div
            v-for="a in apptsFor(d)"
            :key="a.id"
            :style="{
              position: 'absolute',
              left: '5px',
              right: '5px',
              top: (startH(a) - 8) * HH + 2 + 'px',
              height: (a.dur / 60) * HH - 4 + 'px',
              background: a.status === 'pending' ? 'var(--warn-tint)' : 'var(--primary)',
              color: a.status === 'pending' ? 'var(--warn)' : '#fff',
              borderRadius: '9px',
              padding: '7px 9px',
              overflow: 'hidden',
              boxShadow: 'var(--sh-sm)',
              cursor: 'pointer',
              borderLeft: a.status === 'pending' ? '3px solid var(--warn)' : '3px solid var(--primary-deep)',
            }"
          >
            <div style="font-weight: 600; font-size: 12.5px; line-height: 1.2">{{ a.name }}</div>
            <div :style="{ fontSize: '11px', opacity: a.status === 'pending' ? 1 : 0.85 }">{{ a.time }} · {{ a.topic }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Set Availability Modal -->
  <Teleport to="body">
    <div v-if="showSetAvail" class="modal-scrim" @click="showSetAvail = false">
      <div
        class="card pop"
        style="width: 380px; max-width: 94vw; border-radius: 20px; overflow: hidden; box-shadow: var(--sh-lg)"
        @click.stop
      >
        <div style="padding: 22px 26px; border-bottom: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between">
          <div style="font-weight: 600; font-size: 16px">Set availability</div>
          <button class="btn btn-quiet" style="padding: 8px" @click="showSetAvail = false">
            <UiIcon name="x" :size="18" />
          </button>
        </div>

        <div style="padding: 26px; display: flex; flex-direction: column; gap: 20px">
          <!-- Day -->
          <div>
            <div class="kicker" style="margin-bottom: 10px">Day</div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap">
              <button
                v-for="d in DAYS"
                :key="d"
                class="btn btn-sm"
                :style="{
                  background: modalDay === d ? 'var(--primary)' : 'var(--surface-2)',
                  color: modalDay === d ? '#fff' : 'var(--ink)',
                  border: 'none',
                  fontWeight: 600,
                }"
                @click="modalDay = d"
              >{{ d }}</button>
            </div>
          </div>

          <!-- Time range -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
            <div class="field">
              <label style="font-size: 13px; font-weight: 600; margin-bottom: 6px; display: block">Start time</label>
              <select v-model.number="modalStart" class="input" style="font-size: 14px">
                <option v-for="h in HOUR_OPTS.slice(0, -1)" :key="h" :value="h">{{ fmt(h) }}</option>
              </select>
            </div>
            <div class="field">
              <label style="font-size: 13px; font-weight: 600; margin-bottom: 6px; display: block">End time</label>
              <select v-model.number="modalEnd" class="input" style="font-size: 14px">
                <option v-for="h in HOUR_OPTS.slice(1)" :key="h" :value="h">{{ fmt(h) }}</option>
              </select>
            </div>
          </div>

          <p v-if="modalEnd <= modalStart" style="font-size: 13px; color: var(--warn); margin: 0">End time must be after start time.</p>

          <button
            class="btn btn-primary btn-block"
            :disabled="modalEnd <= modalStart"
            @click="saveAvail"
          >
            Save availability
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-scrim {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgba(11, 24, 30, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fade 0.25s ease both;
}
</style>
