import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Card, Empty, ErrorBar, Hint, PageHead, Thumb } from '../components/ui'
import { useInventoryItem, useRestockItem, useUpdateItem } from '../api/hooks'
import { formatDateTime } from '../lib/format'

export function ProductEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const item = useInventoryItem(id)
  const update = useUpdateItem()
  const restock = useRestockItem()

  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [active, setActive] = useState(true)
  const [description, setDescription] = useState('')
  const [restockAmount, setRestockAmount] = useState('10')

  useEffect(() => {
    if (!item.data) return
    setName(item.data.name)
    setPrice(String(item.data.unit_price))
    setStock(String(item.data.stock_quantity))
    setActive(item.data.active)
    setDescription(item.data.description ?? '')
  }, [item.data])

  if (item.isPending) return <Empty title="불러오는 중…" />
  if (item.error) return <ErrorBar error={item.error} />
  if (!item.data) return <Empty title="상품을 찾을 수 없어요" />

  const product = item.data

  function save(event: FormEvent) {
    event.preventDefault()
    update.mutate(
      {
        id: product.id,
        patch: {
          name: name.trim(),
          unit_price: Number(price),
          stock_quantity: Number(stock),
          active,
          description: description.trim() || null,
        },
      },
      { onSuccess: () => navigate('/products') },
    )
  }

  return (
    <form onSubmit={save}>
      <PageHead
        title="상품 수정"
        sub="학생 앱에 표시될 상품 정보를 수정하세요."
        actions={
          <>
            <Link to="/products" className="btn">
              취소
            </Link>
            <button type="submit" className="btn is-primary" disabled={update.isPending}>
              <Icon name="save" />
              {update.isPending ? '저장 중…' : '변경사항 저장'}
            </button>
          </>
        }
      />

      <ErrorBar error={update.error ?? restock.error} />

      <div className="cols">
        <Card title="기본 정보">
          <div className="field">
            <label htmlFor="name">상품명</label>
            <input id="name" value={name} onChange={(event) => setName(event.target.value)} required />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="price">판매가</label>
              <input
                id="price"
                type="number"
                min={0}
                step={100}
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="stock">재고 수량</label>
              <input
                id="stock"
                type="number"
                min={0}
                value={stock}
                onChange={(event) => setStock(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="description">상품 설명</label>
            <textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="상품 설명을 입력해 주세요"
            />
          </div>

          <div className="field">
            <label htmlFor="active">판매 상태</label>
            <select
              id="active"
              value={active ? 'on' : 'off'}
              onChange={(event) => setActive(event.target.value === 'on')}
            >
              <option value="on">판매 중</option>
              <option value="off">품절</option>
            </select>
          </div>

          <Hint>품절로 변경하면 학생 앱에서 주문할 수 없어요.</Hint>
        </Card>

        <Card title="상품 사진">
          <Thumb seed={product.id} size="lg" />
          <p className="hint">
            대표 사진은 정사각형으로 노출돼요. 백엔드에 사진 업로드 API가 없어 기본 이미지가 쓰여요.
          </p>

          <div className="divider" />

          <dl className="kv">
            <dt>상품 코드</dt>
            <dd>{product.sku}</dd>
          </dl>
          <dl className="kv">
            <dt>마지막 수정</dt>
            <dd>{formatDateTime(product.updated_at)}</dd>
          </dl>

          <div className="divider" />

          <div className="field">
            <label htmlFor="restock">재고 보충</label>
            <input
              id="restock"
              type="number"
              min={1}
              value={restockAmount}
              onChange={(event) => setRestockAmount(event.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn"
            disabled={restock.isPending || Number(restockAmount) <= 0}
            onClick={() =>
              restock.mutate(
                { id: product.id, quantity: Number(restockAmount) },
                { onSuccess: (updated) => setStock(String(updated.stock_quantity)) },
              )
            }
          >
            <Icon name="plus" />
            {restock.isPending ? '보충 중…' : `${restockAmount}개 보충`}
          </button>
        </Card>
      </div>
    </form>
  )
}
