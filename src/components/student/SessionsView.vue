<script setup>
import UiIcon from '@/components/common/UiIcon.vue'
import UiAvatar from '@/components/common/UiAvatar.vue'

const emit = defineEmits(['book'])

const upcoming = []
const past = []
</script>

<template>
  <div class="scroll-y" style="flex: 1; height: calc(100vh - 73px); overflow-y: auto">
    <div class="page-inset-narrow" style="max-width: 900px">
      <!-- mentor banner -->
      <div
        class="card rise flex flex-col sm:flex-row"
        style="border-radius: 18px; padding: 24px 28px; margin-bottom: 28px; gap: 20px; align-items: center; background: linear-gradient(120deg, var(--sage-tint), var(--card))"
      >
        <UiAvatar name="Maren Halvorsen" color="var(--primary)" :size="62" />
        <div style="flex: 1; text-align: center">
          <h3 style="font-size: 20px">Dr. Maren Halvorsen</h3>
          <p class="muted" style="font-size: 14px; margin-top: 3px">Your dedicated mentor · responds within a day</p>
        </div>
        <button class="btn btn-primary btn-block sm:btn-block" style="width: 100%; max-width: 100%" @click="emit('book')"><UiIcon name="calendar" :size="17" /> Book a session</button>
      </div>

      <h3 style="font-size: 17px; margin-bottom: 14px">Upcoming</h3>
      <div class="flex flex-col" style="gap: 12px; margin-bottom: 34px">
        <div
          v-for="(s, i) in upcoming"
          :key="i"
          class="card rise d1 session-row flex flex-col sm:flex-row sm:items-center"
          style="border-radius: 14px; padding: 18px; gap: 18px; border-left: 4px solid var(--clay)"
        >
          <div class="flex items-center" style="gap: 18px; width: 100%">
            <div style="text-align: center; width: 64px; flex: none">
            <div style="font-family: var(--serif); font-weight: 700; font-size: 16px; color: var(--clay-deep)">{{ s.date }}</div>
            <div class="muted" style="font-size: 13px">{{ s.time }}</div>
          </div>
          <div style="width: 1px; height: 40px; background: var(--line)" />
          <div style="flex: 1; min-width: 0">
            <div style="font-weight: 600; font-size: 15.5px">{{ s.topic }}</div>
            <div class="muted" style="font-size: 13.5px">{{ s.name }} · {{ s.dur }} min · Video call</div>
          </div>
          </div>
          <div class="flex items-center flex-wrap" style="gap: 8px; width: 100%; sm:width: auto">
            <button class="btn btn-ghost btn-sm" @click="emit('book')">Reschedule</button>
            <button class="btn btn-blue btn-sm"><UiIcon name="video" :size="16" /> Join</button>
          </div>
        </div>
        <div v-if="!upcoming.length" class="muted" style="font-size: 14px; padding: 8px 0">No upcoming sessions. Book one above.</div>
      </div>

      <h3 style="font-size: 17px; margin-bottom: 14px">Past sessions</h3>
      <div class="flex flex-col" style="gap: 12px">
        <div
          v-for="(s, i) in past"
          :key="i"
          class="card rise session-row flex flex-col sm:flex-row sm:items-center"
          :style="{ borderRadius: '14px', padding: '18px', gap: '18px', animationDelay: i * 0.06 + 0.1 + 's' }"
        >
          <div class="flex items-center" style="gap: 18px; width: 100%">
            <div style="text-align: center; width: 64px; flex: none">
            <div style="font-family: var(--serif); font-weight: 700; font-size: 16px">{{ s.date }}</div>
            <div class="muted" style="font-size: 13px">{{ s.time }}</div>
          </div>
          <div style="width: 1px; height: 40px; background: var(--line)" />
          <div style="flex: 1; min-width: 0">
            <div style="font-weight: 600; font-size: 15.5px">{{ s.topic }}</div>
            <div class="muted" style="font-size: 13.5px">
              <UiIcon name="note" :size="13" style="vertical-align: -2px" /> {{ s.note }}
            </div>
          </div>
          </div>
          <button class="btn btn-quiet btn-sm" style="align-self: flex-start">View notes</button>
        </div>
        <div v-if="!past.length" class="muted" style="font-size: 14px; padding: 8px 0">No past sessions yet.</div>
      </div>
    </div>
  </div>
</template>
