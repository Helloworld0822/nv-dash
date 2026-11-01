import { useMemo } from 'react'
import { useInventory, useOrderJobs, useReadiness } from '../api/hooks'
import { useDrones } from './useDrones'
import type { IconName } from '../components/Icon'

export type AlertTone = 'action' | 'scheduled' | 'done'

export interface Alert {
  id: string
  tone: AlertTone
  badge: string
  icon: IconName
  time: string | null
  title: string
  description: string
  action?: { label: string; to: string; icon: IconName }
}

const LOW_STOCK = 5
const STUCK_JOB_MS = 5 * 60 * 1000

/**
 * 백엔드에 알림 전용 엔드포인트가 없어서, 관리자가 실제로 손봐야 하는 신호를
 * 작업 큐 · 재고 · 의존성 상태 · 기체 상태에서 모아 알림으로 만든다.
 */
export function useAlerts() {
  const jobs = useOrderJobs()
  const inventory = useInventory()
  const readiness = useReadiness()
  const drones = useDrones()

  const alerts = useMemo<Alert[]>(() => {
    const list: Alert[] = []
    const now = Date.now()

    for (const job of jobs.data ?? []) {
      if (job.status === 'failed' || (job.last_error && job.attempts >= job.max_attempts)) {
        list.push({
          id: `job-${job.id}`,
          tone: 'action',
          badge: '확인 필요',
          icon: 'alert',
          time: job.updated_at,
          title: '주문 처리 작업이 실패했어요',
          description: `${job.attempts}/${job.max_attempts}회 시도 · ${job.last_error ?? '원인이 기록되지 않았어요'}`,
          action: { label: '작업 보기', to: '/alerts', icon: 'refresh' },
        })
      } else if (job.status === 'queued' && now - new Date(job.created_at).getTime() > STUCK_JOB_MS) {
        list.push({
          id: `job-stuck-${job.id}`,
          tone: 'action',
          badge: '확인 필요',
          icon: 'clock',
          time: job.created_at,
          title: '대기열에 오래 머문 작업이 있어요',
          description: '5분 넘게 처리되지 않았어요. 큐 상태를 확인해 주세요.',
          action: { label: '작업 보기', to: '/alerts', icon: 'list' },
        })
      } else if (job.status === 'completed') {
        list.push({
          id: `job-done-${job.id}`,
          tone: 'done',
          badge: '처리 완료',
          icon: 'check',
          time: job.completed_at ?? job.updated_at,
          title: '주문 처리 작업을 완료했어요',
          description: `${job.attempts}회 시도 후 정상 처리됐어요.`,
        })
      }
    }

    for (const item of inventory.data ?? []) {
      if (item.stock_quantity <= 0) {
        list.push({
          id: `stock-out-${item.id}`,
          tone: 'action',
          badge: '확인 필요',
          icon: 'products',
          time: item.updated_at,
          title: `${item.name} 재고가 없어요`,
          description: item.active
            ? '판매 중인데 재고가 0개예요. 재고를 채우거나 품절로 바꿔 주세요.'
            : '품절로 표시돼 있어요. 재고를 채우면 다시 판매할 수 있어요.',
          action: { label: '상품 수정', to: `/products/${item.id}/edit`, icon: 'edit' },
        })
      } else if (item.stock_quantity <= LOW_STOCK && item.active) {
        list.push({
          id: `stock-low-${item.id}`,
          tone: 'scheduled',
          badge: '예약됨',
          icon: 'products',
          time: item.updated_at,
          title: `${item.name} 재고가 ${item.stock_quantity}개 남았어요`,
          description: '곧 품절될 수 있어요. 재고 보충을 준비해 주세요.',
          action: { label: '상품 수정', to: `/products/${item.id}/edit`, icon: 'edit' },
        })
      }
    }

    for (const drone of drones.list) {
      if (drone.status === 'offline') {
        list.push({
          id: `drone-offline-${drone.id}`,
          tone: 'action',
          badge: '확인 필요',
          icon: 'drone',
          time: drone.lastSeen,
          title: `${drone.name} 상태가 수신되지 않아요`,
          description: '기체 연결을 확인해 주세요.',
          action: { label: '기체 확인', to: `/drones/${encodeURIComponent(drone.id)}`, icon: 'drone' },
        })
      } else if (drone.status === 'maintenance') {
        list.push({
          id: `drone-maint-${drone.id}`,
          tone: 'action',
          badge: '확인 필요',
          icon: 'wrench',
          time: drone.lastSeen,
          title: `${drone.name} 점검이 필요해요`,
          description: '운용 전 프로펠러와 배터리를 점검해 주세요.',
          action: { label: '기체 확인', to: `/drones/${encodeURIComponent(drone.id)}`, icon: 'drone' },
        })
      } else if (drone.battery !== null && drone.battery <= 20) {
        list.push({
          id: `drone-batt-${drone.id}`,
          tone: 'action',
          badge: '확인 필요',
          icon: 'battery',
          time: drone.lastSeen,
          title: `${drone.name} 배터리 ${drone.battery}%`,
          description: '운용 전 충전 상태를 확인해 주세요.',
          action: { label: '충전 상태', to: `/drones/${encodeURIComponent(drone.id)}`, icon: 'battery' },
        })
      }
    }

    const ready = readiness.data
    if (ready) {
      for (const [name, state] of [
        ['Postgres', ready.postgres],
        ['Redis', ready.redis],
      ] as const) {
        if (state && state !== 'ok' && state !== 'up') {
          list.push({
            id: `dep-${name}`,
            tone: 'action',
            badge: '확인 필요',
            icon: 'alert',
            time: null,
            title: `${name} 연결에 문제가 있어요`,
            description: `현재 상태: ${state}. 주문 처리가 지연될 수 있어요.`,
          })
        }
      }
    }

    const rank: Record<AlertTone, number> = { action: 0, scheduled: 1, done: 2 }
    return list.sort((a, b) => {
      if (rank[a.tone] !== rank[b.tone]) return rank[a.tone] - rank[b.tone]
      return new Date(b.time ?? 0).getTime() - new Date(a.time ?? 0).getTime()
    })
  }, [jobs.data, inventory.data, readiness.data, drones.list])

  return {
    alerts,
    actionCount: alerts.filter((alert) => alert.tone === 'action').length,
    isLoading: jobs.isLoading || inventory.isLoading || drones.isLoading,
  }
}
