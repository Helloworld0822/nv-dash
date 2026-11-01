import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Badge, Card, Empty, ErrorBar, Hint, PageHead, Tabs, Thumb } from '../components/ui'
import { useInventory, useUpdateItem } from '../api/hooks'
import { formatWon } from '../lib/format'

type StockTab = 'all' | 'selling' | 'out'
type Sort = 'name' | 'stock' | 'price'

export function ProductsPage() {
  const inventory = useInventory()
  const update = useUpdateItem()
  const [tab, setTab] = useState<StockTab>('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('name')

  const items = inventory.data ?? []
  const sellingCount = items.filter((item) => item.active && item.stock_quantity > 0).length
  const outCount = items.length - sellingCount

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return items
      .filter((item) => {
        const soldOut = !item.active || item.stock_quantity <= 0
        if (tab === 'selling' && soldOut) return false
        if (tab === 'out' && !soldOut) return false
        if (!keyword) return true
        return (
          item.name.toLowerCase().includes(keyword) || item.sku.toLowerCase().includes(keyword)
        )
      })
      .sort((a, b) => {
        if (sort === 'stock') return a.stock_quantity - b.stock_quantity
        if (sort === 'price') return a.unit_price - b.unit_price
        return a.name.localeCompare(b.name)
      })
  }, [items, tab, query, sort])

  return (
    <>
      <PageHead
        title="상품 관리"
        sub="매점에서 판매할 상품과 재고를 관리하세요."
        actions={
          <>
            <Link to="/products/new" className="btn is-primary">
              <Icon name="plus" />
              상품 등록
            </Link>
            <button
              type="button"
              className="btn"
              onClick={() => setSort((value) => (value === 'stock' ? 'name' : 'stock'))}
            >
              <Icon name="sort" />
              {sort === 'stock' ? '재고순' : sort === 'price' ? '가격순' : '이름순'}
            </button>
          </>
        }
      />

      <ErrorBar error={inventory.error ?? update.error} />

      <Card className="product-table">
        <div className="filters">
          <label className="search is-grow">
            <Icon name="search" />
            <input
              placeholder="상품명을 검색해 주세요"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn"
            onClick={() => setSort((value) => (value === 'price' ? 'name' : 'price'))}
          >
            <Icon name="filter" />
            정렬
          </button>
        </div>

        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { key: 'all', label: `전체 ${items.length}` },
            { key: 'selling', label: `판매 중 ${sellingCount}` },
            { key: 'out', label: `품절 ${outCount}` },
          ]}
        />

        <div className="thead">
          <span>상품 정보</span>
          <span>판매가</span>
          <span>재고</span>
          <span>판매 상태</span>
          <span>빠른 변경</span>
          <span>관리</span>
        </div>

        {inventory.isPending ? (
          <Empty title="불러오는 중…" />
        ) : visible.length === 0 ? (
          <Empty
            title={items.length === 0 ? '등록된 상품이 없어요' : '조건에 맞는 상품이 없어요'}
            hint={
              items.length === 0
                ? '오른쪽 위 상품 등록으로 첫 상품을 추가해 보세요.'
                : '검색어나 탭을 바꿔 보세요.'
            }
          />
        ) : (
          visible.map((item) => {
            const soldOut = !item.active || item.stock_quantity <= 0
            return (
              <div key={item.id} className="trow">
                <div className="product-cell">
                  <Thumb seed={item.id} size="sm" />
                  <div>
                    <div className="name">{item.name}</div>
                    <div className="sku">{item.sku}</div>
                  </div>
                </div>
                <span className="price">{formatWon(item.unit_price)}</span>
                <span className={item.stock_quantity <= 0 ? 'stock is-out' : 'stock'}>
                  {item.stock_quantity}개
                </span>
                <span>
                  <Badge tone={soldOut ? 'quiet' : 'brand'}>{soldOut ? '품절' : '판매 중'}</Badge>
                </span>
                <button
                  type="button"
                  className={item.active ? 'quick' : 'quick is-brand'}
                  disabled={update.isPending}
                  onClick={() => update.mutate({ id: item.id, patch: { active: !item.active } })}
                >
                  {item.active ? '품절로 변경' : '판매 재개'}
                </button>
                <Link to={`/products/${item.id}/edit`} className="btn is-sm">
                  <Icon name="edit" />
                  수정
                </Link>
              </div>
            )
          })
        )}

        <div className="table-foot">
          <span>총 {items.length}개 상품</span>
        </div>
      </Card>

      <Hint>재고가 0개인 상품은 품절로 표시돼요. 판매를 재개하기 전에 재고를 확인해 주세요.</Hint>
    </>
  )
}
