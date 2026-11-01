import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Badge, Card, Empty, ErrorBar, PageHead } from '../components/ui'
import { useDrones } from '../lib/useDrones'
import { DRONE_STATUS_LABEL } from '../lib/drones'
import { formatTime, toward } from '../lib/format'

export function DronesPage() {
  const drones = useDrones()
  const navigate = useNavigate()
  const flying = drones.list.find((drone) => drone.status === 'in_transit')

  return (
    <>
      <PageHead
        title="드론 현황"
        sub={`마지막 갱신 ${formatTime(new Date(drones.updatedAt || Date.now()).toISOString())} · 10초마다 자동 갱신`}
        actions={
          <button type="button" className="btn" onClick={() => drones.refetch()}>
            <Icon name="refresh" />
            새로고침
          </button>
        }
      />

      <ErrorBar error={drones.error} />

      <div className="filters">
        <Badge tone="quiet">전체 {drones.list.length}대</Badge>
        <Badge>배송 중 {drones.counts.in_transit}</Badge>
        <Badge>대기 {drones.counts.idle}</Badge>
        <Badge tone="new">충전 {drones.counts.charging}</Badge>
        <Badge>점검 {drones.counts.maintenance}</Badge>
        <span className="spacer" />
        <span className="open-state">
          <span className={drones.counts.offline ? 'dot' : 'dot is-muted'} />
          연결 끊김 {drones.counts.offline}대
        </span>
      </div>

      <div className="cols is-map">
        <Card
          title="교내 배송 지도"
          action={
            <span className="map-legend">
              <span className="dot" /> 배송 중
              <span className="dot" /> 수령 장소
            </span>
          }
        >
          <div className="map" role="img" aria-label="교내 배송 경로 도식" />
          {flying ? (
            <div className="drone-row-top">
              <Icon name="drone" size={24} />
              <div>
                <b style={{ fontSize: 15 }}>
                  {flying.name}
                  {flying.place ? ` · ${toward(flying.place)} 이동` : ''}
                </b>
                <small>
                  {flying.orderNumber ? `주문 ${flying.orderNumber} · ` : ''}
                  마지막 수신 {formatTime(flying.lastSeen)}
                </small>
              </div>
              <Link to={`/drones/${encodeURIComponent(flying.id)}`} className="btn is-primary">
                <Icon name="arrowRight" />
                상세 보기
              </Link>
            </div>
          ) : (
            <p className="hint">
              <Icon name="drone" />
              <span>
                지금 배송 중인 기체가 없어요. 비행이 시작되면 경로와 도착 예정 시각이 표시돼요.
              </span>
            </p>
          )}
        </Card>

        <Card title="기체 목록" action={<span className="today">{drones.list.length}대</span>}>
          <div className="drone-list">
            {drones.isPending ? (
              <Empty title="불러오는 중…" />
            ) : drones.list.length === 0 ? (
              <Empty
                title="등록된 기체가 없어요"
                hint="백엔드의 비행·배송 기록이 비어 있어요. 기체가 운행을 시작하면 여기에 표시돼요."
              />
            ) : (
              drones.list.map((drone) => (
                <button
                  key={drone.id}
                  type="button"
                  className="drone-row"
                  onClick={() => navigate(`/drones/${encodeURIComponent(drone.id)}`)}
                >
                  <div className="drone-row-top">
                    <Icon name="drone" size={24} />
                    <div>
                      <b>{drone.name}</b>
                      <small>{drone.place ?? '매점 스테이션'}</small>
                    </div>
                    <Badge tone={drone.status === 'charging' ? 'new' : 'brand'}>
                      {DRONE_STATUS_LABEL[drone.status]}
                    </Badge>
                  </div>
                  <div className="drone-row-foot">
                    <Icon name="battery" size={16} />
                    <b>{drone.battery === null ? '—' : `${drone.battery}%`}</b>
                    <span>{drone.linkOk ? '연결 정상' : '연결 끊김'}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>
      </div>
    </>
  )
}
