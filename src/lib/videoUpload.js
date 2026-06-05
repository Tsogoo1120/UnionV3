import { supabase } from '@/lib/supabase.js'

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const MAX_THUMB_BYTES = 3 * 1024 * 1024
const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024

export async function uploadThumbnailToStorage(file, slug) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { error: 'Зөвхөн JPEG, PNG эсвэл WebP зураг сонгоно уу.' }
  }
  if (file.size > MAX_THUMB_BYTES) {
    return { error: 'Зургийн хэмжээ 3 MB-аас хэтрэхгүй байх ёстой.' }
  }
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `lessons/${slug}/thumbnail.${ext}`
  const { error } = await supabase.storage
    .from('media-thumbnails')
    .upload(path, file, { contentType: file.type, upsert: true })
  if (error) return { error: error.message }
  return { path }
}

export async function uploadVideoToR2(file, kind, aspect, sessionToken) {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return { error: 'Зөвхөн MP4 эсвэл WebM видео сонгоно уу.' }
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return { error: 'Видеоны хэмжээ 2 GB-аас хэтрэхгүй байх ёстой.' }
  }
  const presignRes = await fetch(`${SERVER_URL}/api/r2/presign-upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionToken}`,
    },
    body: JSON.stringify({ filename: file.name, contentType: file.type, kind, aspect }),
  })
  if (!presignRes.ok) {
    const txt = await presignRes.text()
    return { error: `Видео бэлтгэхэд алдаа: ${presignRes.status} ${txt}` }
  }
  const { key, uploadUrl } = await presignRes.json()
  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  if (!putRes.ok) {
    return { error: `Видео байршуулахад алдаа: ${putRes.status}` }
  }
  return { key }
}

export function readVideoDuration(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      const d = video.duration
      resolve(Number.isFinite(d) && d > 0 ? Math.round(d) : null)
    }
    video.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
    video.src = url
  })
}

export function getThumbnailUrl(path) {
  if (!path) return null
  const { data } = supabase.storage.from('media-thumbnails').getPublicUrl(path)
  return data?.publicUrl ?? null
}

export async function uploadIntroVideoToStorage(file) {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return { error: 'Зөвхөн MP4 эсвэл WebM видео сонгоно уу.' }
  }
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'mp4'
  const path = `intro/commercial.${ext}`
  const { error } = await supabase.storage
    .from('media-public')
    .upload(path, file, { contentType: file.type, upsert: true })
  if (error) return { error: error.message }
  return { path }
}

export function getIntroVideoPublicUrl(path) {
  if (!path) return null
  const { data } = supabase.storage.from('media-public').getPublicUrl(path)
  return data?.publicUrl ?? null
}

export function getPresignDownloadUrl(lessonId, sessionToken, aspect = 'desktop') {
  return fetch(
    `${SERVER_URL}/api/r2/presign-download?lessonId=${lessonId}&aspect=${aspect}`,
    { headers: { Authorization: `Bearer ${sessionToken}` } },
  ).then(async (res) => {
    if (!res.ok) {
      const code = res.status
      if (code === 403) return { error: 'subscription_required' }
      return { error: `fetch_error_${code}` }
    }
    const { url } = await res.json()
    return { url }
  }).catch(() => ({ error: 'network_error' }))
}
