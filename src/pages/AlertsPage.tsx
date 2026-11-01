import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Badge, Card, Empty, ErrorBar, PageHead, Tabs } from '../components/ui'
import { useAlerts, type Alert } from '../lib/useAlerts'
import { useOrderJobs, useQueueStats, useRetryJob } from '../api/hooks'
import { formatTime } from '../lib/format'

type AlertTab = 'action' | 'all' | 'done'

export function AlertsPage() {
  const { alerts, actionCount, isLoading } = useAlerts()
  const jobs = useOrderJobs()
  const queue = useQueueStats()
  const retry = useRetryJob()
  const [tab, setTab] = useState<AlertTab>('action')

  const doneCount = alerts.filter((alert) => alert.tone === 'done').length
  const visible = alerts.filter((alert) => {
    if (tab === 'all') return true
    if (tab === 'done') return alert.tone === 'done'
    return alert.tone === 'action'
  })

  const failedJobs = (jobs.data ?? []).filter((job) => job.status === 'failed')

  function exportLog() {
    const rows = alerts.map((alert) => ({
      time: alert.time,
      badge: alert.badge,
      title: alert.title,
      description: alert.description,
    }))
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `운용기록-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <PageHead
        title="알림·점검"
        sub="기체 상태와 점검 내역을 한곳에서 확인하세요."
        actions={
          <button type="button" className="btn" onClick={exportLog} disabled={alerts.length === 0}>
            <Icon name="download" />
            운용 기록 내보내기
          </button>
        }
      />

      <ErrorBar error={jobs.error} />

      <div className="notice">
        <Icon name="alert" size={21} />
        <div>
          <strong>
            {actionCount > 0
              ? `지금 확인할 알림이 ${actionCount}건 있어요`
              : '지금 확인할 알림이 없어요'}
          </strong>
          <p>
            {actionCount > 0
              ? '연결 끊김과 재고 부족 알림을 먼저 확인해 주세요.'
              : '작업 큐와 재고, 기체 상태가 모두 정상이에요.'}
          </p>
        </div>
      </div>

      <Card>
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { key: 'action', label: `확인 필요 ${actionCount}` },
            { key: 'all', label: `전체 ${alerts.length}` },
            { key: 'done', label: `점검 내역 ${doneCount}` },
          ]}
        />

        {isLoading ? (
          <Empty title="불러오는 중…" />
        ) : visible.length === 0 ? (
          <Empty
            title="표시할 알림이 없어요"
            hint="작업 실패, 재고 부족, 기체 이상이 생기면 여기에 모여요."
          />
        ) : (
          visible.map((alert) => <AlertRow key={alert.id} alert={alert} />)
        )}
      </Card>

      <div className="cols">
        <Card title="실패한 처리 작업">
          {failedJobs.length === 0 ? (
            <Empty title="실패한 작업이 없어요" hint="주문 처리 대기열이 정상이에요." />
          ) : (
            failedJobs.map((job) => (
              <div key={job.id} className="trow" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
                <div>
                  <b>{job.id.slice(0, 8)}</b>
                  <div className="sku">
                    {job.attempts}/{job.max_attempts}회 시도 · {job.last_error ?? '원인 미기록'}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn is-sm"
                  disabled={retry.isPending}
                  onClick={() => retry.mutate(job.id)}
                >
                  <Icon name="refresh" />
                  다시 시도
                </button>
              </div>
            ))
          )}
        </Card>

        <Card title="처리 대기열">
          {queue.error ? (
            <ErrorBar error={queue.error} />
          ) : (
            <>
              {(queue.data?.jobs ?? []).length === 0 ? (
                <Empty title="대기 중인 작업이 없어요" />
              ) : (
                (queue.data?.jobs ?? []).map((row) => (
                  <dl key={row.status} className="kv">
                    <dt>{row.status}</dt>
                    <dd>{row.count}건</dd>
                  </dl>
                ))
              )}
              <dl className="kv">
                <dt>누적 이벤트</dt>
                <dd>{queue.data?.events ?? 0}건</dd>
              </dl>
            </>
          )}
        </Card>
      </div>
    </>
  )
}

function AlertRow({ alert }: { alert: Alert }) {
  return (
    <div className="alert-row">
      <span className="alert-icon">
        <Icon name={alert.icon} size={22} />
      </span>
      <div className="alert-body">
        <div className="alert-meta">
          <Badge tone={alert.tone === 'action' ? 'new' : 'quiet'}>{alert.badge}</Badge>
          <time>{formatTime(alert.time)}</time>
        </div>
        <h4>{alert.title}</h4>
        <p>{alert.description}</p>
      </div>
      {alert.action && (
        <Link to={alert.action.to} className="btn is-sm">
          <Icon name={alert.action.icon} />
          {alert.action.label}
        </Link>
      )}
    </div>
  )
}
