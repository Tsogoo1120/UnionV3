<script setup>
import { ref } from 'vue'
import UiIcon from '@/components/common/UiIcon.vue'

const avail = ref(true)
const appts = []

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
const HH = 58
const windows = {}

const dayOf = (a) => a.date.split(' ')[0]
const startH = (a) => parseInt(a.time.split(':')[0]) + (a.time.split(':')[1] === '30' ? 0.5 : 0)
const apptsFor = (d) => appts.filter((a) => dayOf(a) === d)
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
        <button class="btn btn-primary btn-sm"><UiIcon name="plus" :size="16" /> Set availability</button>
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
</template>
