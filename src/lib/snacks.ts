import { z } from 'zod'

export interface Snack {
  id: string
  name: string
  maker: string
  category: '스낵' | '비스킷'
}

/** 기본 간식 메타데이터. 실제 상품 등록 목록과 사진은 재고 API에서 조회한다. */
export const SNACK_CATALOG: Snack[] = [
  { id: 'saeukkang', name: '새우깡', maker: '농심', category: '스낵' },
  { id: 'kkulkkwabaegi', name: '꿀꽈배기', maker: '농심', category: '스낵' },
  { id: 'yangparing', name: '양파링', maker: '농심', category: '스낵' },
  { id: 'bananakick', name: '바나나킥', maker: '농심', category: '스낵' },
  { id: 'potatochip', name: '포테토칩 오리지널', maker: '농심', category: '스낵' },
  { id: 'ojingeojip', name: '오징어집', maker: '농심', category: '스낵' },
  { id: 'goraebap', name: '고래밥', maker: '오리온', category: '비스킷' },
  { id: 'chocosongi', name: '초코송이', maker: '오리온', category: '비스킷' },
]

/** 같은 시각에 등록하는 상품도 구분할 수 있도록 UUID로 상품 코드를 만든다. */
export function suggestSku(snack?: Snack) {
  const base = snack?.id.replace(/[^a-z0-9]/g, '').slice(0, 8).toUpperCase() || 'CUSTOM'
  return `${base}-${crypto.randomUUID().toUpperCase()}`
}
const nonnegativeInteger = z.string().trim().min(1).transform(Number).pipe(
  z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
)

export const productDraftSchema = z.object({
  name: z.string().trim().min(1),
  maker: z.string().trim(),
  category: z.string().trim(),
  description: z.string().trim(),
  price: nonnegativeInteger,
  stock: nonnegativeInteger.refine((stock) => stock <= 2_147_483_647),
  active: z.boolean(),
}).transform((draft) => ({
  name: draft.name,
  unit_price: draft.price,
  stock_quantity: draft.stock,
  description: [
    [draft.maker, draft.category].filter(Boolean).join(' · '),
    draft.description,
  ].filter(Boolean).join('\n') || null,
  active: draft.active,
}))
