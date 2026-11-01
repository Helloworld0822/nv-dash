import { toward } from './format'

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending_payment: '결제 대기',
  paid: '신규 주문',
  preparing: '준비 중',
  ready: '준비 완료',
  assigned: '배차됨',
  in_transit: '배송 중',
  delivered: '수령 완료',
  cancelled: '취소됨',
  failed: '실패',
}

export function orderStatusLabel(status: string) {
  return ORDER_STATUS_LABEL[status] ?? status
}

export type OrderTab = 'new' | 'preparing' | 'transit' | 'done'

export const ORDER_TABS: { key: OrderTab; label: string; statuses: string[] }[] = [
  { key: 'new', label: '신규', statuses: ['pending_payment', 'paid'] },
  { key: 'preparing', label: '준비 중', statuses: ['preparing', 'ready'] },
  { key: 'transit', label: '배송 중', statuses: ['assigned', 'in_transit'] },
  { key: 'done', label: '완료', statuses: ['delivered', 'cancelled', 'failed'] },
]

/** 상태별로 관리자가 누를 다음 단계. 백엔드가 거절하면 화면에 오류를 띄운다. */
export function nextStep(status: string): { label: string; status: string } | null {
  switch (status) {
    case 'pending_payment':
    case 'paid':
      return { label: '주문 접수', status: 'preparing' }
    case 'preparing':
      return { label: '준비 완료', status: 'ready' }
    case 'ready':
      return { label: '배송 시작', status: 'in_transit' }
    case 'assigned':
      return { label: '배송 시작', status: 'in_transit' }
    case 'in_transit':
      return { label: '수령 완료', status: 'delivered' }
    default:
      return null
  }
}

export function canCancel(status: string) {
  return !['delivered', 'cancelled', 'failed'].includes(status)
}

export function isActiveOrder(status: string) {
  return ['pending_payment', 'paid', 'preparing', 'ready', 'assigned', 'in_transit'].includes(
    status,
  )
}

const EVENT_LABEL: Record<string, string> = {
  'order.created': '주문이 접수됐어요',
  'order.paid': '결제가 완료됐어요',
  'order.status_changed': '주문 상태가 바뀌었어요',
  'order.cancelled': '주문이 취소됐어요',
  'order.delivered': '주문이 수령 완료됐어요',
  'order.failed': '주문 처리가 실패했어요',
  'inventory.updated': '재고를 변경했어요',
  'inventory.restocked': '재고를 보충했어요',
  'job.enqueued': '처리 대기열에 올렸어요',
  'job.failed': '대기열 처리가 실패했어요',
}

export function eventLabel(event: { event_type: string; payload?: Record<string, unknown> }) {
  const base = EVENT_LABEL[event.event_type] ?? event.event_type
  const status = event.payload?.['status']
  if (event.event_type === 'order.status_changed' && typeof status === 'string') {
    return `주문 상태가 ${toward(orderStatusLabel(status))} 바뀌었어요`
  }
  return base
}
