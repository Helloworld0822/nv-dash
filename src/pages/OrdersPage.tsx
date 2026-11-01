import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Badge, Card, Empty, ErrorBar, PageHead, Tabs, Thumb } from '../components/ui'
import { useInventory, useOrder, useOrders, useUpdateOrderStatus } from '../api/hooks'
import type { Order } from '../api/types'
import { formatDateTime, formatTime, formatWon, shortOrderNumber } from '../lib/format'
import { ORDER_TABS, canCancel, nextStep, orderStatusLabel, type OrderTab } from '../lib/orderStatus'

export function OrdersPage() {
  const [tab, setTab] = useState<OrderTab>('new')
  const [limit, setLimit] = useState(50)
  const [params, setParams] = useSearchParams()
  const selectedId = params.get('order')

  const orders = useOrders({ limit })
  const detail = useOrder(selectedId ?? undefined)
  const inventory = useInventory()
  const updateStatus = useUpdateOrderStatus()

  const itemNames = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of inventory.data ?? []) map.set(item.id, item.name)
    return map
  }, [inventory.data])

  const byTab = useMemo(() => {
    const groups = new Map<OrderTab, Order[]>()
    for (const entry of ORDER_TABS) groups.set(entry.key, [])
    for (const order of orders.data?.items ?? []) {
      const entry = ORDER_TABS.find((candidate) => candidate.statuses.includes(order.status))
      if (entry) groups.get(entry.key)!.push(order)
    }
    return groups
  }, [orders.data])

  const visible = byTab.get(tab) ?? []
  const selected = detail.data
  const step = selected ? nextStep(selected.status) : null

  function select(id: string) {
    const next = new URLSearchParams(params)
    next.set('order', id)
    setParams(next, { replace: true })
  }

  return (
    <>
      <PageHead
        title="주문 관리"
        sub="접수부터 수령까지, 주문의 다음 단계를 확인하세요."
        actions={
          <button type="button" className="btn" onClick={() => void orders.refetch()}>
            <Icon name="calendar" />
            오늘 {new Date().toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
          </button>
        }
      />

      <ErrorBar error={orders.error} />

      <div className="cols is-even">
        <Card>
          <Tabs
            value={tab}
            onChange={setTab}
            items={ORDER_TABS.map((entry) => ({
              key: entry.key,
              label: `${entry.label} ${(byTab.get(entry.key) ?? []).length}`,
            }))}
          />

          <div className="order-list">
            {visible.length === 0 ? (
              <Empty
                title="이 단계의 주문이 없어요"
                hint="다른 탭을 확인하거나 새 주문을 기다려 주세요."
              />
            ) : (
              visible.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  className={order.id === selectedId ? 'order-card is-active' : 'order-card'}
                  onClick={() => select(order.id)}
                >
                  <div className="order-card-top">
                    <b>{shortOrderNumber(order.order_number)}</b>
                    <Badge tone={order.status === 'paid' ? 'new' : 'brand'}>
                      {orderStatusLabel(order.status)}
                    </Badge>
                  </div>
                  <div className="order-card-name">{order.customer_name}</div>
                  <div className="order-card-meta">
                    <span>
                      {order.delivery_address} · {formatTime(order.created_at)} 접수
                    </span>
                    <Icon name="chevronRight" size={16} />
                  </div>
                </button>
              ))
            )}
          </div>

          {(orders.data?.total ?? 0) > limit && (
            <button type="button" className="btn is-sm" onClick={() => setLimit((v) => v + 50)}>
              더 보기 (총 {orders.data?.total}건)
            </button>
          )}
        </Card>

        <Card>
          {!selectedId ? (
            <Empty title="주문을 선택해 주세요" hint="왼쪽 목록에서 주문을 고르면 상세가 보여요." />
          ) : detail.isPending ? (
            <Empty title="불러오는 중…" />
          ) : detail.error ? (
            <ErrorBar error={detail.error} />
          ) : (
            selected && (
              <>
                <div className="detail-head">
                  <div>
                    <h3>주문 {shortOrderNumber(selected.order_number)}</h3>
                    <p>
                      {formatDateTime(selected.created_at)} 접수 · 주문번호 {selected.order_number}
                    </p>
                  </div>
                  <Badge tone={selected.status === 'paid' ? 'new' : 'brand'}>
                    {orderStatusLabel(selected.status)}
                  </Badge>
                </div>

                <div className="divider" />

                {selected.items.map((item) => (
                  <div key={item.id} className="line-item">
                    <Thumb seed={item.item_id} />
                    <div>
                      <div className="name">{itemNames.get(item.item_id) ?? '상품'}</div>
                      <div className="qty">{item.quantity}개</div>
                    </div>
                    <div className="price">{formatWon(item.line_total)}</div>
                  </div>
                ))}

                <div className="divider" />

                <dl className="kv">
                  <dt>주문자</dt>
                  <dd>
                    {selected.customer_name} · {selected.customer_phone}
                  </dd>
                </dl>
                <dl className="kv">
                  <dt>수령 장소</dt>
                  <dd>
                    {selected.delivery_address}
                    {selected.delivery_detail ? ` ${selected.delivery_detail}` : ''}
                  </dd>
                </dl>
                <dl className="kv">
                  <dt>요청사항</dt>
                  <dd>{selected.notes || '없음'}</dd>
                </dl>
                <dl className="kv">
                  <dt>배달비 / 결제금액</dt>
                  <dd>
                    {selected.payment ? selected.payment.status : '미결제'} /{' '}
                    {formatWon(selected.total_amount)}
                  </dd>
                </dl>

                {step && (
                  <p className="notice">
                    <Icon name="help" />
                    <span>{step.label}을 누르면 주문 상태가 바뀌고 학생에게 안내가 전달돼요.</span>
                  </p>
                )}

                <ErrorBar error={updateStatus.error} />

                <div className="detail-actions">
                  {canCancel(selected.status) && (
                    <button
                      type="button"
                      className="btn is-soft"
                      disabled={updateStatus.isPending}
                      onClick={() =>
                        updateStatus.mutate({ id: selected.id, status: 'cancelled' })
                      }
                    >
                      접수 불가
                    </button>
                  )}
                  {step ? (
                    <button
                      type="button"
                      className="btn is-primary is-wide"
                      disabled={updateStatus.isPending}
                      onClick={() => updateStatus.mutate({ id: selected.id, status: step.status })}
                    >
                      <Icon name="check" />
                      {updateStatus.isPending ? '처리 중…' : step.label}
                    </button>
                  ) : (
                    <span className="hint">이 주문은 더 진행할 단계가 없어요.</span>
                  )}
                </div>
              </>
            )
          )}
        </Card>
      </div>
    </>
  )
}
