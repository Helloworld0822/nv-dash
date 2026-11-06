# nv-dash · 교내 배달 관리자

Figma [교내 배달 · 관리자 디자인](https://www.figma.com/design/5cG3AE9mvVh4PadWxF4P54) 의 관리자 화면을
React 로 구현한 대시보드입니다. 백엔드는
[NeuroVector API](https://neurovector-backend.forge-lang.org/swagger-ui/) 를 그대로 씁니다.

## 실행

```bash
npm ci
npm run dev        # http://localhost:5173/nv-dash/
```

운영 번들:

```bash
npm run build
npm run preview    # http://localhost:4173/nv-dash/
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
| 운영 현황 | `/` | `GET /admin/orders/stats`, `GET /admin/orders`, `GET /admin/order-events`, `GET /flights/status` |
| 주문 관리 | `/orders` | `GET /admin/orders`, `GET /orders/{id}`, `PATCH /orders/{id}/status` |
| 상품 관리 | `/products` | `GET /inventory`, `PATCH /inventory/{id}` |
| 상품 등록 | `/products/new` | `POST /inventory` |
| 상품 수정 | `/products/:id/edit` | `GET·PATCH /inventory/{id}`, `POST /inventory/{id}/restock` |
| 드론 현황 | `/drones` | `GET /flights/status` |
| 드론 상세 | `/drones/:id` | `GET /flights/status`, `GET /admin/order-events` |
| 알림·점검 | `/alerts` | `GET /admin/order-jobs`, `GET /admin/queue/stats`, `GET /inventory`, `GET /health/ready` |

## 백엔드가 덮지 못하는 부분

- **드론 데이터** — `/api/v1/flights/status`의 최신 텔레메트리와 서버의 연결 판정을 사용합니다. 배터리는 백분율이며 주문 번호·수령 장소는 응답에 없어 미지정으로 표시합니다.
- **알림** — 알림 전용 엔드포인트가 없습니다. 실패한 처리 작업, 재고 0·부족, 기체 이상,
  `/health/ready` 의 Postgres·Redis 상태를 모아 알림 목록을 만듭니다 (`src/lib/useAlerts.ts`).
- **상품 등록 목록** — 활성 상품과 사진을 실제 재고 DB에서 자동으로 읽습니다. 목록에 없는 상품은 직접 입력으로 이름·제조사·카테고리·가격·재고를 등록하고, 생성 직후 사진 편집 화면으로 이동합니다. 공식 간식·사진 보완은 `infra/catalog/import_snacks.py`가 기존 데이터를 보존하며 수행합니다.
- **상품 사진** — `/api/v1/inventory/photos`와 `/inventory/{id}/photo`를 사용합니다. 상품 수정 화면에서 JPG·PNG·WebP(1MB 이하)를 등록하며, 사진이 없으면 아이콘을 표시합니다. 파일 또는 이미지 URL을 미리 본 뒤 명시적으로 저장하며, 외부 사이트의 CORS 차단 시 파일 업로드를 안내합니다.

운영 경로는 `/nv-dash/`입니다. API는 같은 출처의 `/api`, `/health`로 요청합니다. 개발 기본 백엔드는 `http://localhost:8080`입니다. HTTPS 백엔드의 Secure·SameSite 쿠키 속성은 프록시에서도 유지되므로 HTTPS 개발 출처를 사용하세요.

검증: `npm run build`, `npm run lint`, `npm test`.
