import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Card, Empty, ErrorBar, Hint, PageHead, Thumb } from '../components/ui'
import { useCreateItem, useInventory } from '../api/hooks'
import { productDraftSchema, suggestSku } from '../lib/snacks'
import type { InventoryItem } from '../api/types'

export function ProductNewPage() {
  const navigate = useNavigate()
  const create = useCreateItem()
  const inventory = useInventory()

  const [picked, setPicked] = useState<InventoryItem | null>(null)
  const [custom, setCustom] = useState(false)
  const [sku] = useState(() => suggestSku())
  const [name, setName] = useState('')
  const [maker, setMaker] = useState('')
  const [category, setCategory] = useState('')
  const [step, setStep] = useState<1 | 2>(1)
  const [query, setQuery] = useState('')

  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [active, setActive] = useState(true)
  const [description, setDescription] = useState('')

  const snacks = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return (inventory.data ?? []).filter((snack) => {
      if (!snack.active) return false
      if (!keyword) return true
      return (
        snack.name.toLowerCase().includes(keyword) || snack.description?.toLowerCase().includes(keyword)
      )
    })
  }, [query, inventory.data])

  const draft = productDraftSchema.safeParse({ name, maker, category, price, stock, description, active })

  function startCustom() {
    if (!custom) {
      setName('')
      setMaker('')
      setCategory('')
      setDescription('')
      setPrice('')
      setStock('')
      setActive(true)
    }
    setCustom(true)
    setStep(2)
  }

  function startCatalog() {
    if (!picked) return
    const [metadata = '', ...details] = (picked.description ?? '').split('\n')
    const [sourceMaker = '', ...sourceCategory] = metadata.split(' · ')
    const hasMetadata = sourceCategory.length > 0
    setCustom(false)
    setName(picked.name)
    setMaker(hasMetadata ? sourceMaker : '')
    setCategory(hasMetadata ? sourceCategory.join(' · ') : '')
    setDescription(hasMetadata ? details.join('\n') : picked.description ?? '')
    setPrice(String(picked.unit_price))
    setStock(String(picked.stock_quantity))
    setActive(picked.active)
    setStep(2)
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!draft.success || create.isPending) return
    create.mutate(
      {
        ...draft.data,
        sku,
        currency: 'KRW',
      },
      { onSuccess: (item) => navigate(`/products/${item.id}/edit`) },
    )
  }

  if (step === 1) {
    return (
      <>
        <PageHead
          title="상품 등록"
          sub="저장된 상품을 고르거나 새 상품을 직접 입력하세요."
          actions={
            <>
              <button type="button" className="btn" onClick={startCustom}>
                직접 입력 · 사용자 지정
              </button>
              <Link to="/products" className="btn">
                취소
              </Link>
            </>
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

          <ErrorBar error={inventory.error} />

          <div className="pick-scroll">
            {inventory.isPending ? <Empty title="상품 목록 불러오는 중…" /> : snacks.length === 0 ? (
              <Empty title="검색 결과가 없어요" hint="다른 이름으로 검색하거나 직접 입력해 주세요." />
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
                    <Thumb seed={snack.id} />
                    <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                      <b>{snack.name}</b>
                      <small>
                        {snack.description || snack.sku}
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
            <div style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
              <b>{picked ? `${picked.name} 선택됨` : '상품을 선택해 주세요'}</b>
              <small>{picked ? picked.description || picked.sku : '목록에서 고르거나 직접 입력하세요.'}</small>
            </div>
            <button
              type="button"
              className="btn is-primary"
              disabled={!picked}
              onClick={startCatalog}
            >
              <Icon name="arrowRight" />
              다음 · 판매 정보 입력
            </button>
          </div>
        </Card>

        <Hint>
          상품 목록과 사진은 저장된 상품에서 불러옵니다. 목록에 없는 상품은 직접 입력할 수 있어요.
        </Hint>
      </>
    )
  }

  const canSubmit = draft.success

  return (
    <form onSubmit={submit}>
      <PageHead
        title="판매 정보 입력"
        sub="상품명과 판매 정보를 입력하세요. 등록 후 상품 수정 화면에서 사진을 추가할 수 있어요."
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
          <div className="field">
            <label htmlFor="name">상품명 (필수)</label>
            <input id="name" value={name} onChange={(event) => setName(event.target.value)} required />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="maker">제조사 (선택)</label>
              <input id="maker" value={maker} onChange={(event) => setMaker(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="category">카테고리 (선택)</label>
              <input id="category" value={category} onChange={(event) => setCategory(event.target.value)} />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="price">판매가</label>
              <input
                id="price"
                type="number"
                min={0}
                step={1}
                max={Number.MAX_SAFE_INTEGER}
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
                step={1}
                max={2_147_483_647}
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
            <label htmlFor="description">상품 설명 (선택)</label>
            <textarea
              id="description"
              placeholder="상품 설명을 입력해 주세요"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <Hint>판매가와 재고는 0 이상의 정수로 입력해 주세요. 제조사와 카테고리는 상품 설명에 함께 저장됩니다.</Hint>
        </Card>

        <Card title={custom ? '사용자 지정 상품' : '선택한 상품'}>
          <div className="picked-card">
            <span className="mark">
              <Icon name="products" />
            </span>
            <div>
              <b>{name || '상품명을 입력해 주세요'}</b>
              <span>{maker || '제조사 미입력'}</span>
            </div>
          </div>
          <div className="divider" />
          <dl className="kv">
            <dt>카테고리</dt>
            <dd>{category || '미입력'}</dd>
          </dl>
          <dl className="kv">
            <dt style={{ flexShrink: 0 }}>상품 코드</dt>
            <dd style={{ overflowWrap: 'anywhere' }}>{sku}</dd>
          </dl>
          <p className="hint">등록 후 상품 수정 화면에서 사진을 선택하고 업로드할 수 있어요.</p>
          <button type="button" className="btn" onClick={() => setStep(1)}>
            <Icon name="chevronLeft" />
            상품 다시 선택
          </button>
        </Card>
      </div>
    </form>
  )
}
