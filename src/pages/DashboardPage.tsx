import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Badge, Card, Empty, ErrorBar, PageHead, StatCard } from '../components/ui'
import { useOrderEvents, useOrderStats, useOrders } from '../api/hooks'
import { useDrones } from '../lib/useDrones'
import { useAlerts } from '../lib/useAlerts'
import { DRONE_STATUS_LABEL } from '../lib/drones'
import { formatTime, shortOrderNumber } from '../lib/format'
import { eventLabel, isActiveOrder, orderStatusLabel } from '../lib/orderStatus'

export function DashboardPage() {
  const stats = useOrderStats()
  const orders = useOrders({ limit: 20 })
  const events = useOrderEvents(6)
  const drones = useDrones()
  const { alerts, actionCount } = useAlerts()

  const newCount = (stats.data?.paid ?? 0) + (stats.data?.pending_payment ?? 0)
  const transitCount = (stats.data?.in_transit ?? 0) + (stats.data?.assigned ?? 0)
  const readyDrones = drones.counts.idle + drones.counts.in_transit

  const activeOrders = (orders.data?.items ?? []).filter((order) => isActiveOrder(order.status))
  const topAlert = alerts.find((alert) => alert.tone === 'action')
  const flying = drones.list.find((drone) => drone.status === 'in_transit')

  function refresh() {
    void stats.refetch()
    void orders.refetch()
    void events.refetch()
    drones.refetch()
  }

  return (
    <>
      <PageHead
        title="운영 현황"
        sub="오늘의 주문과 교내 배송 상황을 확인하세요."
        actions={
          <button type="button" className="btn" onClick={refresh}>
            <Icon name="refresh" />
            새로고침
          </button>
        }
      />

      <ErrorBar error={stats.error ?? orders.error} />

      <div className="stat-grid">
        <StatCard label="신규 주문" value={newCount} unit="건" icon="orders" accent />
        <StatCard label="배송 중" value={transitCount} unit="건" icon="pin" />
        <StatCard label="운용 가능 드론" value={readyDrones} unit="대" icon="drone" />
        <StatCard label="확인할 알림" value={actionCount} unit="건" icon="bell" />
      </div>

      <div className="cols">
        <Card
          title="진행 중인 주문"
          action={
            <Link className="btn is-sm" to="/orders">
              전체 보기
            </Link>
          }
        >
          <div className="thead" style={{ gridTemplateColumns: '100px minmax(0,1fr) 150px 90px' }}>
            <span>주문</span>
            <span>주문자</span>
            <span>수령 장소</span>
            <span>상태</span>
          </div>
          {activeOrders.length === 0 ? (
            <Empty
              title="진행 중인 주문이 없어요"
              hint="새 주문이 들어오면 여기에서 바로 확인할 수 있어요."
            />
          ) : (
            activeOrders.slice(0, 5).map((order) => (
              <Link
                key={order.id}
                to={`/orders?order=${order.id}`}
                className="trow"
                style={{ gridTemplateColumns: '100px minmax(0,1fr) 150px 90px' }}
              >
                <span>
                  <b>{shortOrderNumber(order.order_number)}</b>
                  <br />
                  <small style={{ color: 'var(--muted)' }}>{formatTime(order.created_at)}</small>
                </span>
                <span>{order.customer_name}</span>
                <span>{order.delivery_address}</span>
                <Badge tone={order.status === 'paid' ? 'new' : 'brand'}>
                  {orderStatusLabel(order.status)}
                </Badge>
              </Link>
            ))
          )}
        </Card>

        <Card
          title="드론 운용"
          action={
            <Link className="btn is-sm" to="/drones">
              현황 보기
            </Link>
          }
        >
          <div className="drone-counts">
            <div className="drone-count">
              <b>{drones.counts.in_transit}</b>
              <span>배송 중</span>
            </div>
            <div className="drone-count">
              <b>{drones.counts.idle}</b>
              <span>대기</span>
            </div>
            <div className="drone-count is-warn">
              <b>{drones.counts.charging + drones.counts.maintenance}</b>
              <span>충전·점검</span>
            </div>
          </div>
          <div className="divider" />

          {flying ? (
            <>
              <Link to={`/drones/${encodeURIComponent(flying.id)}`} className="drone-row-top">
                <Icon name="drone" size={20} />
                <b>{flying.name}</b>
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                  {flying.place ? `${flying.place}(으)로 이동` : '배송 중'}
                </span>
                <Icon name="chevronRight" size={16} />
              </Link>
              <div className="kv">
                <dt>배터리 / 마지막 수신</dt>
                <dd>
                  {flying.battery === null ? '—' : `${flying.battery}%`} / {formatTime(flying.lastSeen)}
                </dd>
              </div>
            </>
          ) : (
            <Empty
              title="배송 중인 기체가 없어요"
              hint={
                drones.list.length === 0
                  ? '등록된 기체가 아직 없어요. 비행이 시작되면 여기에 표시돼요.'
                  : '대기 중인 기체만 있어요.'
              }
            />
          )}

          {topAlert && (
            <Link to="/alerts" className="notice">
              <Icon name="alert" />
              <div>
                <strong>{topAlert.title}</strong>
                <p>{topAlert.description}</p>
              </div>
            </Link>
          )}
        </Card>
      </div>

      <div className="cols">
        <Card title="최근 운영 기록">
          {(events.data ?? []).length === 0 ? (
            <Empty title="기록이 아직 없어요" hint="주문과 재고 변경이 생기면 여기에 쌓여요." />
          ) : (
            (events.data ?? []).map((event) => (
              <div key={event.event_id} className="feed">
                <span className="dot" />
                <time>{formatTime(event.created_at)}</time>
                <span>{eventLabel(event)}</span>
              </div>
            ))
          )}
        </Card>

        <Card
          title="확인할 알림"
          action={<Badge>{actionCount}건</Badge>}
        >
          {actionCount === 0 ? (
            <Empty title="확인할 알림이 없어요" hint="기체와 재고 모두 정상이에요." />
          ) : (
            alerts
              .filter((alert) => alert.tone === 'action')
              .slice(0, 3)
              .map((alert) => (
                <Link key={alert.id} to="/alerts" className="timeline">
                  <Icon name={alert.icon} size={22} />
                  <div>
                    <b>{alert.title}</b>
                    <span>{alert.description}</span>
                  </div>
                </Link>
              ))
          )}
          {drones.list.length > 0 && (
            <p className="hint">
              <Icon name="drone" />
              <span>
                기체 {drones.list.length}대 ·{' '}
                {(Object.keys(DRONE_STATUS_LABEL) as (keyof typeof DRONE_STATUS_LABEL)[])
                  .filter((key) => drones.counts[key] > 0)
                  .map((key) => `${DRONE_STATUS_LABEL[key]} ${drones.counts[key]}`)
                  .join(' · ')}
              </span>
            </p>
          )}
        </Card>
      </div>
    </>
  )
}
