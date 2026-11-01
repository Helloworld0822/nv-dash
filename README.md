# nv-dash · 교내 배달 관리자

Figma [교내 배달 · 관리자 디자인](https://www.figma.com/design/5cG3AE9mvVh4PadWxF4P54) 의 관리자 화면을
React 로 구현한 대시보드입니다. 백엔드는
[NeuroVector API](https://neurovector-backend.forge-lang.org/swagger-ui/) 를 그대로 씁니다.

## 실행

```bash
npm install
npm run dev        # http://0.0.0.0:5173
```

운영 번들:

```bash
npm run build
npm run preview    # http://0.0.0.0:4173
```

백엔드 주소는 `NV_BACKEND` 환경변수로 바꿀 수 있습니다.

```bash
NV_BACKEND=http://localhost:8080 npm run dev
```

## 인증

백엔드는 `nv_admin_session` 쿠키 세션을 씁니다. 브라우저가 쿠키를 저장하도록
Vite 의 `server.proxy` / `preview.proxy` 로 `/api` 와 `/health` 를 같은 출처로 넘깁니다.
그래서 0.0.0.0 으로 띄운 뒤 다른 IP로 접속해도 CORS 화이트리스트에 걸리지 않습니다.

로그인 폼의 입력값은 `POST /api/v1/admin/auth/login` 의 `username` / `password` 입니다.
(디자인에는 "이메일"로 적혀 있지만 API 필드는 `username` 이라 "아이디"로 표기했습니다.)

## 화면과 API

| 화면 | 경로 | 사용하는 엔드포인트 |
| --- | --- | --- |
| 관리자 로그인 | `/login` | `POST /admin/auth/login`, `GET /admin/auth/me` |
| 운영 현황 | `/` | `GET /admin/orders/stats`, `GET /admin/orders`, `GET /admin/order-events`, `GET /flights`, `GET /deliveries` |
| 주문 관리 | `/orders` | `GET /admin/orders`, `GET /orders/{id}`, `PATCH /orders/{id}/status` |
| 상품 관리 | `/products` | `GET /inventory`, `PATCH /inventory/{id}` |
| 상품 등록 | `/products/new` | `POST /inventory` |
| 상품 수정 | `/products/:id/edit` | `GET·PATCH /inventory/{id}`, `POST /inventory/{id}/restock` |
| 드론 현황 | `/drones` | `GET /flights`, `GET /deliveries` |
| 드론 상세 | `/drones/:id` | `GET /flights`, `GET /deliveries`, `GET /admin/order-events` |
| 알림·점검 | `/alerts` | `GET /admin/order-jobs`, `GET /admin/queue/stats`, `GET /inventory`, `GET /health/ready` |

## 백엔드가 덮지 못하는 부분

- **드론 데이터** — `/api/v1/flights`, `/api/v1/deliveries` 는 OpenAPI 문서에 없고 현재 빈 배열을
  돌려줍니다. 응답 필드 이름을 확정할 수 없어 `src/lib/drones.ts` 에서 흔한 키 이름을 훑어 화면용
  모델로 추립니다. 데이터가 없으면 빈 상태가 보입니다.
- **알림** — 알림 전용 엔드포인트가 없습니다. 실패한 처리 작업, 재고 0·부족, 기체 이상,
  `/health/ready` 의 Postgres·Redis 상태를 모아 알림 목록을 만듭니다 (`src/lib/useAlerts.ts`).
- **상품 등록 1단계의 과자 목록** — 제조사 카탈로그 API가 없어 디자인에 적힌 품목을
  `src/lib/snacks.ts` 에 내장했습니다. 2단계에서 입력한 판매가·재고와 함께 `POST /inventory` 로
  등록됩니다.
- **상품 사진** — 업로드 API가 없어 Figma 에서 받은 기본 이미지를 상품 id 로 고르게 배분합니다.
