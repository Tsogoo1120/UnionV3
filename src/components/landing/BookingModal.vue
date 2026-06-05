<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { calDays } from '@/data/booking-calendar.js'
import UiIcon from '@/components/common/UiIcon.vue'
import UiAvatar from '@/components/common/UiAvatar.vue'
import { supabase } from '@/lib/supabase.js'

const props = defineProps({
  open: { type: Boolean, default: false },
})
const emit = defineEmits(['close'])

const step = ref(0)
const bookDate = ref(null)
const bookSlot = ref(null)
const topic = ref('')
const availMap = ref({}) // { Mon: [9,17], ... }

async function loadAvailability() {
  const { data } = await supabase.from('mentor_availability').select('day, start_hour, end_hour')
  const m = {}
  if (data) for (const row of data) m[row.day] = [row.start_hour, row.end_hour]
  availMap.value = m
}

const availDays = computed(() =>
  calDays.filter((d) => availMap.value[d.d])
)

const currentSlots = computed(() => {
  if (!bookDate.value) return []
  const w = availMap.value[bookDate.value.d]
  if (!w) return []
  const slots = []
  for (let h = w[0]; h < w[1]; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
})

watch(
  () => props.open,
  (v) => {
    if (v) {
      step.value = 0
      bookSlot.value = null
      bookDate.value = availDays.value[0] ?? calDays.find((d) => !d.unavail) ?? calDays[0]
      topic.value = ''
    }
  },
)

onMounted(loadAvailability)

function confirmBooking() {
  if (!bookDate.value || !bookSlot.value) return
  sessionStorage.setItem(
    'union-booking-prefill',
    JSON.stringify({
      bookDate: { d: bookDate.value.d, n: bookDate.value.n },
      bookSlot: bookSlot.value,
    }),
  )
  step.value = 2
}
</script>

<template>
  <Teleport to="body">
  <div v-if="open" class="modal-scrim" @click="emit('close')">
    <div
      class="card pop"
      style="width: 560px; max-width: 94vw; border-radius: 20px; overflow: hidden; box-shadow: var(--sh-lg)"
      @click.stop
    >
      <div
        class="flex items-center justify-between"
        style="padding: 22px 26px; border-bottom: 1px solid var(--line)"
      >
        <div class="flex items-center gap-3">
          <UiAvatar name="Maren Halvorsen" color="var(--primary)" :size="40" />
          <div>
            <div style="font-weight: 600">Consultation with Dr. Maren</div>
            <div class="muted" style="font-size: 13px">30 min · Free intro · Video call</div>
          </div>
        </div>
        <button class="btn btn-quiet" style="padding: 8px" @click="emit('close')">
          <UiIcon name="x" :size="18" />
        </button>
      </div>

      <div v-if="step < 2" style="padding: 26px">
        <div class="kicker cool" style="margin-bottom: 14px">Өдөр сонгох</div>
        <div v-if="availDays.length" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 26px">
          <button
            v-for="day in availDays"
            :key="day.n"
            type="button"
            class="daycell"
            :style="{
              borderColor: bookDate?.n === day.n ? 'var(--primary)' : 'var(--line)',
              background: bookDate?.n === day.n ? 'var(--primary-tint)' : 'var(--card)',
              color: bookDate?.n === day.n ? 'var(--primary-deep)' : 'var(--ink)',
            }"
            @click="bookDate = day; bookSlot = null"
          >
            <span style="font-size: 12px; font-weight: 600; opacity: 0.7">{{ day.d }}</span>
            <span style="font-size: 21px; font-family: var(--serif); font-weight: 600">{{ day.n }}</span>
          </button>
        </div>
        <p v-else class="muted" style="font-size: 14px; margin-bottom: 26px">Одоогоор боломжит цаг байхгүй байна.</p>
        <div class="kicker cool" style="margin-bottom: 14px">Боломжит цаг</div>
        <div v-if="currentSlots.length" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px" class="slot-grid">
          <button
            v-for="s in currentSlots"
            :key="s"
            type="button"
            class="slotcell"
            :style="{
              borderColor: bookSlot === s ? 'var(--clay)' : 'var(--line)',
              background: bookSlot === s ? 'var(--clay)' : 'var(--card)',
              color: bookSlot === s ? '#fff' : 'var(--ink)',
            }"
            @click="bookSlot = s"
          >
            {{ s }}
          </button>
        </div>
        <p v-else-if="bookDate" class="muted" style="font-size: 14px">Энэ өдөрт боломжит цаг байхгүй.</p>
        <div class="field" style="margin-top: 22px">
          <label
            >What would you like to focus on?
            <span class="muted" style="font-weight: 400">(optional)</span></label
          >
          <input
            v-model="topic"
            class="input"
            placeholder="e.g. career direction, managing stress…"
          />
        </div>
        <button
          class="btn btn-primary btn-block btn-lg"
          style="margin-top: 22px"
          :disabled="!bookSlot"
          @click="confirmBooking"
        >
          Confirm booking
        </button>
      </div>

      <div v-else style="padding: 40px 26px; text-align: center">
        <div
          class="pop"
          style="width: 70px; height: 70px; border-radius: 50%; background: var(--good-tint); color: var(--good); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px"
        >
          <UiIcon name="check" :size="34" />
        </div>
        <h3 style="font-size: 24px; margin-bottom: 10px">You’re booked.</h3>
        <p class="muted" style="max-width: 360px; margin: 0 auto 6px; font-size: 15px">
          {{ bookDate?.d }} {{ bookDate?.n }} · {{ bookSlot }}. A calendar invite and video link are on their way to
          your inbox.
        </p>
        <button class="btn btn-ghost" style="margin-top: 22px" @click="emit('close')">Done</button>
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
.daycell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 12px 0;
  border: 1.5px solid;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.daycell:hover {
  border-color: var(--primary);
}
.slotcell {
  padding: 12px 0;
  border: 1.5px solid;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14.5px;
  transition: all 0.15s;
}
.slotcell:hover {
  border-color: var(--clay);
}
@media (max-width: 767px) {
  .slot-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}
</style>
