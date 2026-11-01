const won = new Intl.NumberFormat('ko-KR')

export function formatWon(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return '—'
  return `${won.format(amount)}원`
}

export function formatCount(value: number | null | undefined) {
  if (value === null || value === undefined) return '—'
  return won.format(value)
}

export function formatTime(iso: string | null | undefined) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const today = new Date()
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  const time = formatTime(iso)
  if (sameDay) return `오늘 ${time}`
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${time}`
}

export function formatToday(date = new Date()) {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

/** 주문번호 SPT-1027-1042 에서 화면에 쓰는 짧은 번호(#1042)를 뽑는다. */
export function shortOrderNumber(orderNumber: string) {
  const tail = orderNumber.split('-').pop()
  return `#${tail && tail.length <= 6 ? tail : orderNumber.slice(-4)}`
}

/** 같은 상품에는 항상 같은 사진이 걸리도록 id 를 스프라이트 슬롯으로 매핑한다. */
export function thumbSlot(key: string) {
  let hash = 0
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return hash % 3
}
