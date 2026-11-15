import { Link, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Badge, Card, Empty, ErrorBar, PageHead } from '../components/ui'
import { useDrones } from '../lib/useDrones'
import { DRONE_STATUS_LABEL } from '../lib/drones'
import { useOrderEvents } from '../api/hooks'
import { formatTime } from '../lib/format'
import { eventLabel } from '../lib/orderStatus'

export function DroneDetailPage() {
  const { id } = useParams()
  const drones = useDrones()
  const events = useOrderEvents(8)

  const drone = drones.list.find((candidate) => candidate.id === id)

  if (drones.isPending) return <Empty title="불러오는 중…" />
  if (!drone) {
    return (
      <>
        <PageHead
          title="드론 상세"
          actions={
            <Link to="/drones" className="btn">
              <Icon name="chevronLeft" />
              드론 목록
            </Link>
          }
        />
        <ErrorBar error={drones.error} />
        <Card>
          <Empty
            title="기체를 찾을 수 없어요"
            hint="목록이 갱신되었을 수 있어요. 드론 목록에서 다시 선택해 주세요."
          />
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHead
        title={drone.name}
        sub={`기체 상세 · ${DRONE_STATUS_LABEL[drone.status]} · ${drone.linkOk ? '연결 정상' : '연결 끊김'}`}
        actions={
          <>
            <Link to="/drones" className="btn">
              <Icon name="chevronLeft" />
              드론 목록
            </Link>
            <Link to="/alerts" className="btn">
              <Icon name="list" />
              운용 기록
            </Link>
          </>
        }
      />

      <div className="cols is-map">
        <Card
          title="진행 중인 배송"
          action={<Badge>{DRONE_STATUS_LABEL[drone.status]}</Badge>}
        >
          <div className="map is-sm" role="img" aria-label="배송 경로 도식" />
          <div className="leg">
            <div className="leg-step">
              <span>매점 스테이션</span>
              <b>출발 {formatTime(drone.lastSeen)}</b>
            </div>
            <Icon name="arrowRight" size={26} />
            <div className="leg-step">
              <span>{drone.place ?? '수령 장소 미지정'}</span>
              <b>{drone.status === 'in_transit' ? '배송 중' : '대기 중'}</b>
            </div>
          </div>
        </Card>

        <div className="stack">
          <Card
            title="기체 상태"
            action={
              <span className="open-state">
                <span className={drone.linkOk ? 'dot' : 'dot is-muted'} />
                {drone.linkOk ? '정상' : '끊김'}
              </span>
            }
          >
            <div className="battery">
              <Icon name="battery" size={30} />
              <b>{drone.battery === null ? '—' : `${drone.battery}%`}</b>
              <Badge tone={drone.battery !== null && drone.battery <= 20 ? 'new' : 'brand'}>
                {DRONE_STATUS_LABEL[drone.status]}
              </Badge>
            </div>
            <dl className="kv">
              <dt>연결</dt>
              <dd>
                {drone.linkOk ? '정상' : '끊김'} · 마지막 수신 {formatTime(drone.lastSeen)}
              </dd>
            </dl>
            <dl className="kv">
              <dt>기체 번호</dt>
              <dd>{drone.name}</dd>
            </dl>
            <dl className="kv">
              <dt>현재 주문</dt>
              <dd>{drone.orderNumber ?? '없음'}</dd>
            </dl>
            <dl className="kv">
              <dt>수령 장소</dt>
              <dd>{drone.place ?? '—'}</dd>
            </dl>
          </Card>

          <Card title="최근 상태">
            {(events.data ?? []).length === 0 ? (
              <Empty title="기록이 아직 없어요" hint="주문 이벤트가 생기면 여기에 쌓여요." />
            ) : (
              (events.data ?? []).slice(0, 4).map((event) => (
                <div key={event.event_id} className="timeline">
                  <span className="dot" />
                  <div>
                    <b>{eventLabel(event)}</b>
                    <span>{formatTime(event.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
