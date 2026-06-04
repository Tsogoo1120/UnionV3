<script setup>
import { ref, computed, onMounted } from 'vue'
import { courses } from '@/data/union.js'
import { supabase } from '@/lib/supabase.js'
import UiIcon from '@/components/common/UiIcon.vue'
import UiAvatar from '@/components/common/UiAvatar.vue'
import UiBar from '@/components/common/UiBar.vue'
import StatCard from './StatCard.vue'

const emit = defineEmits(['set-view', 'book'])

const c = courses[0]
const current = computed(() => c.modules.flatMap((m) => m.lessons).find((l) => l.current))

const stats = [
  { icon: 'flame', hue: 'var(--clay)', tint: 'var(--clay-tint)', label: 'Day streak', value: 12 },
  { icon: 'video', hue: 'var(--primary-deep)', tint: 'var(--primary-tint)', label: 'Lessons done', value: 8 },
  { icon: 'compass', hue: 'var(--sage-deep)', tint: 'var(--sage-tint)', label: 'Tests taken', value: 2 },
  { icon: 'calendar', hue: 'var(--gold)', tint: 'var(--gold-tint)', label: 'Sessions', value: 1 },
]

const todayTasks = [
  ["5-min grounding breath", true],
  ["Today's lesson", true],
  ["Reflection entry", false],
]

const recentJourneys = ref([])

onMounted(async () => {
  const { data } = await supabase
    .from('community_posts')
    .select('id, title, body, created_at, profiles ( full_name ), comments ( id )')
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(2)
  recentJourneys.value = data ?? []
})
</script>

<template>
  <div class="scroll-y" style="flex: 1; height: calc(100vh - 73px); overflow-y: auto">
    <div class="page-inset-narrow">
      <!-- Continue learning hero -->
      <div
        class="card rise grid-split-hero"
        style="border-radius: 18px; overflow: hidden; margin-bottom: 24px"
      >
        <div style="padding: 30px 32px">
          <span class="chip clay" style="margin-bottom: 16px"><UiIcon name="play" :size="13" fill /> Continue where you left off</span>
          <h2 style="font-size: 27px; margin-bottom: 8px">{{ current.title }}</h2>
          <div class="muted" style="font-size: 14.5px; margin-bottom: 18px">{{ c.title }} · Module 2 · {{ current.dur }}</div>
          <div style="max-width: 320px; margin-bottom: 20px">
            <div class="flex items-center justify-between" style="font-size: 12.5px; margin-bottom: 7px">
              <span class="muted">Course progress</span><span style="font-weight: 600">42%</span>
            </div>
            <UiBar :value="0.42" />
          </div>
          <button class="btn btn-primary btn-lg" @click="emit('set-view', 'learn')">
            <UiIcon name="play" :size="17" fill /> Resume lesson
          </button>
        </div>
        <div
          class="grain"
          :style="{
            position: 'relative',
            background: `linear-gradient(150deg, ${c.hue}, color-mix(in srgb, ${c.hue} 50%, #16313f))`,
            minHeight: '220px',
          }"
        >
          <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center">
            <div
              style="width: 70px; height: 70px; border-radius: 50%; background: rgba(255, 255, 255, 0.92); display: flex; align-items: center; justify-content: center; color: var(--clay); box-shadow: var(--sh-lg)"
            >
              <UiIcon name="play" :size="30" fill />
            </div>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid-stats-4" style="margin-bottom: 24px">
        <div v-for="(s, i) in stats" :key="i" class="rise" :style="{ animationDelay: i * 0.05 + 0.1 + 's' }">
          <StatCard v-bind="s" />
        </div>
      </div>

      <div class="grid-split">
        <!-- Today's challenge — temporarily deactivated
        <div class="card card-pad rise d2" style="border-radius: 16px">
          <div class="flex items-center justify-between" style="margin-bottom: 18px">
            <div class="flex items-center" style="gap: 12px">
              <div style="width: 40px; height: 40px; border-radius: 10px; background: var(--clay-tint); color: var(--clay); display: flex; align-items: center; justify-content: center">
                <UiIcon name="flame" :size="21" />
              </div>
              <div>
                <h3 style="font-size: 17px">Today · Day 12</h3>
                <div class="muted" style="font-size: 13px">Theme: Soften</div>
              </div>
            </div>
            <button class="btn btn-soft btn-sm" @click="emit('set-view', 'challenge')">Open <UiIcon name="arrowRight" :size="15" /></button>
          </div>
          <p style="font-size: 16px; font-family: var(--serif); font-style: italic; color: var(--ink-soft); margin-bottom: 16px; line-height: 1.5">
            "What would the calmest version of you do right now?"
          </p>
          <div class="flex flex-col" style="gap: 9px">
            <div
              v-for="[t, done] in todayTasks"
              :key="t"
              class="flex items-center"
              :style="{ gap: '12px', fontSize: '14.5px', color: done ? 'var(--muted)' : 'var(--ink)' }"
            >
              <span :style="{ color: done ? 'var(--sage-deep)' : 'var(--faint)' }">
                <UiIcon :name="done ? 'checkCircle' : 'plus'" :size="19" />
              </span>
              <span :style="{ textDecoration: done ? 'line-through' : 'none' }">{{ t }}</span>
            </div>
          </div>
        </div>
        -->

        <!-- Next session -->
        <div class="card card-pad rise d3" style="border-radius: 16px">
          <h3 style="font-size: 17px; margin-bottom: 16px">Upcoming session</h3>
          <div style="background: var(--surface-2); border-radius: 12px; padding: 16px; margin-bottom: 14px">
            <div class="flex items-center" style="gap: 12px; margin-bottom: 12px">
              <UiAvatar name="Maren Halvorsen" color="var(--primary)" :size="42" />
              <div>
                <div style="font-weight: 600; font-size: 14.5px">Dr. Maren H.</div>
                <div class="muted" style="font-size: 12.5px">Career crossroads</div>
              </div>
            </div>
            <div class="flex items-center" style="gap: 16px; font-size: 13px; color: var(--ink-soft)">
              <span class="flex items-center" style="gap: 6px"><UiIcon name="calendar" :size="15" /> Tomorrow</span>
              <span class="flex items-center" style="gap: 6px"><UiIcon name="clock" :size="15" /> 09:00 · 45m</span>
            </div>
          </div>
          <button class="btn btn-ghost btn-block btn-sm" @click="emit('book')">Reschedule</button>
        </div>
      </div>

      <!-- Community preview -->
      <div class="card card-pad rise d4" style="border-radius: 16px; margin-top: 24px">
        <div class="flex items-center justify-between" style="margin-bottom: 18px">
          <div class="flex items-center" style="gap: 12px">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: var(--primary-tint); color: var(--primary-deep); display: flex; align-items: center; justify-content: center">
              <UiIcon name="users" :size="21" />
            </div>
            <div>
              <h3 style="font-size: 17px">Community journeys</h3>
              <div class="muted" style="font-size: 13px">Vlog-style shares from fellow learners</div>
            </div>
          </div>
          <button class="btn btn-soft btn-sm" @click="emit('set-view', 'community')">
            View all <UiIcon name="arrowRight" :size="15" />
          </button>
        </div>

        <div v-if="recentJourneys.length" class="flex flex-col" style="gap: 12px">
          <div
            v-for="post in recentJourneys"
            :key="post.id"
            class="flex items-start"
            style="gap: 12px; padding: 14px; background: var(--surface-2); border-radius: 12px; cursor: pointer"
            @click="emit('set-view', 'community')"
          >
            <UiAvatar :name="post.profiles?.full_name ?? 'Member'" :size="38" />
            <div style="flex: 1; min-width: 0">
              <div style="font-weight: 600; font-size: 14.5px; margin-bottom: 2px">{{ post.title }}</div>
              <div class="muted" style="font-size: 13px; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden">
                {{ post.body }}
              </div>
              <div class="flex items-center" style="gap: 12px; margin-top: 8px; font-size: 12.5px; color: var(--faint)">
                <span class="flex items-center" style="gap: 4px"><UiIcon name="message" :size="13" /> {{ post.comments?.length ?? 0 }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="muted" style="font-size: 14px; padding: 12px 0">No posts yet — be the first to share.</div>

        <button class="btn btn-primary btn-block btn-sm" style="margin-top: 16px" @click="emit('set-view', 'community')">
          <UiIcon name="pen" :size="15" /> Share your journey
        </button>
      </div>
    </div>
  </div>
</template>
