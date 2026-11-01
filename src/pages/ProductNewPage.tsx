import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Card, Empty, ErrorBar, Hint, PageHead, Tabs } from '../components/ui'
import { useCreateItem } from '../api/hooks'
import { SNACK_CATALOG, suggestSku, type Snack } from '../lib/snacks'

type CategoryTab = 'all' | '스낵' | '비스킷'

export function ProductNewPage() {
  const navigate = useNavigate()
  const create = useCreateItem()

  const [picked, setPicked] = useState<Snack | null>(null)
  const [step, setStep] = useState<1 | 2>(1)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<CategoryTab>('all')

  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [active, setActive] = useState(true)
  const [description, setDescription] = useState('')

  const snacks = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return SNACK_CATALOG.filter((snack) => {
      if (tab !== 'all' && snack.category !== tab) return false
      if (!keyword) return true
      return (
        snack.name.toLowerCase().includes(keyword) || snack.maker.toLowerCase().includes(keyword)
      )
    })
  }, [query, tab])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!picked) return
    create.mutate(
      {
        sku: suggestSku(picked),
        name: picked.name,
        unit_price: Number(price),
        stock_quantity: Number(stock),
        description: description.trim() || `${picked.maker} · ${picked.category}`,
        active,
        currency: 'KRW',
      },
      { onSuccess: () => navigate('/products') },
    )
  }

  if (step === 1) {
    return (
      <>
        <PageHead
          title="상품 등록"
          sub="등록할 과자를 먼저 골라 주세요."
          actions={
            <Link to="/products" className="btn">
              취소
            </Link>
          }
        />

        <Card>
          <label className="search">
            <Icon name="search" />
            <input
              placeholder="과자 이름 또는 제조사를 검색해 주세요"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { key: 'all', label: `전체 ${SNACK_CATALOG.length}` },
              {
                key: '스낵',
                label: `스낵 ${SNACK_CATALOG.filter((s) => s.category === '스낵').length}`,
              },
              {
                key: '비스킷',
                label: `비스킷 ${SNACK_CATALOG.filter((s) => s.category === '비스킷').length}`,
              },
            ]}
          />

          <div className="pick-scroll">
            {snacks.length === 0 ? (
              <Empty title="검색 결과가 없어요" hint="다른 이름이나 제조사로 찾아보세요." />
            ) : (
              snacks.map((snack) => {
                const isPicked = picked?.id === snack.id
                return (
                  <button
                    key={snack.id}
                    type="button"
                    className={isPicked ? 'pick-row is-picked' : 'pick-row'}
                    onClick={() => setPicked(snack)}
                  >
                    <span className="pick-icon">
                      <Icon name="products" />
                    </span>
                    <span>
                      <b>{snack.name}</b>
                      <small>
                        {snack.maker} · {snack.category}
                      </small>
                    </span>
                    <span className="pick-state">{isPicked ? '선택됨' : '선택'}</span>
                    <span className="radio">{isPicked && <Icon name="check" size={14} />}</span>
                  </button>
                )
              })
            )}
          </div>

          <div className="pick-foot">
            <div>
              <b>{picked ? `${picked.name} 선택됨` : '과자를 선택해 주세요'}</b>
              <small>{picked ? `${picked.maker} · ${picked.category}` : '목록에서 하나를 고르세요.'}</small>
            </div>
            <button
              type="button"
              className="btn is-primary"
              disabled={!picked}
              onClick={() => setStep(2)}
            >
              <Icon name="arrowRight" />
              다음 · 판매 정보 입력
            </button>
          </div>
        </Card>

        <Hint>
          과자 목록은 화면에 내장된 카탈로그예요. 선택한 과자에 매점 판매가와 재고를 입력하면 상품으로
          등록됩니다.
        </Hint>
      </>
    )
  }

  const canSubmit = Boolean(picked) && price.trim() !== '' && stock.trim() !== ''

  return (
    <form onSubmit={submit}>
      <PageHead
        title="판매 정보 입력"
        sub="선택한 과자의 판매가와 재고를 입력하세요."
        actions={
          <>
            <button type="button" className="btn" onClick={() => setStep(1)}>
              이전
            </button>
            <button type="submit" className="btn is-primary" disabled={!canSubmit || create.isPending}>
              <Icon name="save" />
              {create.isPending ? '등록 중…' : '상품 등록'}
            </button>
          </>
        }
      />

      <ErrorBar error={create.error} />

      <div className="cols">
        <Card title="판매 정보">
          <div className="picked-card">
            <span className="mark">
              <Icon name="products" />
            </span>
            <div>
              <b>{picked?.name}</b>
              <span>
                {picked?.maker} · {picked?.category}
              </span>
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="price">판매가</label>
              <input
                id="price"
                type="number"
                min={0}
                step={100}
                placeholder="판매가를 입력해 주세요"
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
                placeholder="재고 수량을 입력해 주세요"
                value={stock}
                onChange={(event) => setStock(event.target.value)}
                required
              />
            </div>
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

          <div className="field">
            <label htmlFor="description">상품 설명</label>
            <textarea
              id="description"
              placeholder="상품 설명을 입력해 주세요"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <Hint>판매가와 재고 수량을 입력하면 상품을 등록할 수 있어요.</Hint>
        </Card>

        <Card title="선택한 과자">
          <div className="picked-card">
            <span className="mark">
              <Icon name="products" />
            </span>
            <div>
              <b>{picked?.name}</b>
              <span>{picked?.maker}</span>
            </div>
          </div>
          <div className="divider" />
          <dl className="kv">
            <dt>카테고리</dt>
            <dd>{picked?.category}</dd>
          </dl>
          <dl className="kv">
            <dt>상품 코드</dt>
            <dd>등록할 때 자동으로 만들어져요</dd>
          </dl>
          <p className="hint">선택한 상품에 매점의 판매가와 재고를 입력해 주세요.</p>
          <button type="button" className="btn" onClick={() => setStep(1)}>
            <Icon name="chevronLeft" />
            과자 다시 선택
          </button>
        </Card>
      </div>
    </form>
  )
}
