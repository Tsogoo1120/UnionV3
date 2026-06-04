/** Shared day/slot options for landing booking UI and enroll flow */
export const calDays = []

export const calSlots = []

export function formatBookingSummary(bookDate, bookSlot) {
  if (!bookDate || !bookSlot) return null
  return `${bookDate.d} ${bookDate.n} · ${bookSlot}`
}
