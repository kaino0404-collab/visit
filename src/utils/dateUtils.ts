export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export function formatRelativeDate(iso: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(iso)
  target.setHours(0, 0, 0, 0)
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000)

  if (diff === 0) return '오늘'
  if (diff === 1) return '내일'
  if (diff === -1) return '어제'
  if (diff > 0 && diff <= 7) return `${diff}일 후`
  if (diff < 0 && diff >= -7) return `${Math.abs(diff)}일 전`
  return formatDate(iso)
}

export function isUpcoming(iso: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(iso) >= today
}

export function isWithinDays(iso: string, days: number): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(iso)
  const diff = (target.getTime() - today.getTime()) / 86400000
  return diff >= 0 && diff <= days
}

export function visitTypeLabel(type: string): string {
  const map: Record<string, string> = {
    visit: '방문',
    meal: '식사',
    call: '전화',
    other: '기타'
  }
  return map[type] ?? type
}
