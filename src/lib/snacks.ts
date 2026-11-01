export interface Snack {
  id: string
  name: string
  maker: string
  category: '스낵' | '비스킷'
}

/**
 * 상품 등록 1단계의 "과자 선택" 목록.
 * 백엔드에 제조사 카탈로그 엔드포인트가 없어서 디자인에 적힌 품목을 그대로 둔다.
 * 2단계에서 입력한 판매가·재고와 함께 POST /api/v1/inventory 로 등록된다.
 */
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

/** 상품 코드(SKU)는 영문 대문자로 만들어야 해서 카탈로그 id 를 쓴다. */
export function suggestSku(snack: Snack) {
  const base = snack.id.replace(/[^a-z0-9]/g, '').slice(0, 8).toUpperCase()
  return `${base}-${Date.now().toString(36).slice(-4).toUpperCase()}`
}
