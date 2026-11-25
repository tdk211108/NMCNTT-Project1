# CoreRaster — Đồ án 1 (Nhập môn CNTT, HCMUS)

> **Lưu ý / Notice:** Đây là sản phẩm **Đồ án 1 môn Nhập môn Công nghệ Thông tin** tại Trường Đại học Khoa học Tự nhiên, ĐHQG TP.HCM (HCMUS). Website chỉ phục vụ mục đích học tập và trình diễn, **không bán hàng thật** và **không phát sinh giao dịch hay chuyển khoản thật**.

## Tổng quan tính năng

- **Storefront & Catalog:** Trang chủ Hero Showcase, danh mục `/cpu` (88 mẫu Intel/AMD) và `/gpu` (21 dòng GPU / 232 biến thể AIB, lọc tab *Tất cả GPU* & *Limited Edition*), tìm kiếm tức thì (`/search`), trang chi tiết sản phẩm (`/products/[id]`) kèm kính lúp ảnh sản phẩm.
- **Công cụ phân tích phần cứng:**
  - So sánh thông số & hiệu năng chuẩn hóa PassMark (`/compare`).
  - Bảng xếp hạng Hiệu năng/Giá & Vinh danh phần cứng (`/tools/perf-per-price`).
  - Tính công suất nguồn PSU (`/tools/psu`) dùng chung dữ liệu bán lẻ + danh mục tham khảo đời cũ (37 CPU, 76 dòng GPU).
  - Gợi ý Combo theo ngân sách (`/tools/combo`) & Tư vấn nâng cấp kèm cảnh báo tương thích (`/tools/upgrade`).
- **Giỏ hàng, Đặt hàng & Theo dõi đơn (Mô phỏng):**
  - Tự động đồng bộ giá/trạng thái sản phẩm và hiển thị **Lưu ý kỹ thuật** trong `/cart` (PSU, nền tảng socket/RAM, xung đột nhiều CPU, kích thước GPU, cân bằng cặp CPU+GPU).
  - Đăng nhập khách hàng (Username/Password, Google PKCE OAuth2, Facebook OAuth2) và Admin Mode (`/admin*`).
  - Checkout mô phỏng 3 phương thức (`COD`, `VietQR Demo`, `Thẻ mô phỏng`), bảng theo dõi 5 giai đoạn (`/orders/[orderId]`) và âm thanh UI SFX (`Web Audio API` + `/applepay.mp3` khi giao hàng thành công).

## Công nghệ sử dụng

- **Framework:** Next.js 16 (App Router), React 19, TypeScript 6
- **UI & Motion:** Tailwind CSS v4, `@base-ui/react`, `motion`, `lucide-react`, `react-hot-toast`
- **Database & Storage:** PostgreSQL (Supabase + Drizzle ORM + `postgres` driver), Supabase Storage (`product-images`)
- **State & Validation:** TanStack Query, Zustand, React Hook Form + Zod
- **Testing:** Vitest (Unit + Coverage + Docker Postgres 16 integration), Playwright (`tests/e2e` cho Bước 6)

## Chạy dự án trên máy cục bộ

### 1. Cài đặt phụ thuộc & cấu hình môi trường

```bash
npm install
cp .env.example .env
```

Điền đầy đủ giá trị trong `.env` (tham khảo chú thích trong [.env.example](.env.example)), giữ dữ liệu Excel/ảnh mẫu trong [`data/seed/`](data/seed/), và đảm bảo đã chạy migration/seed lên PostgreSQL:

```bash
npm run db:migrate
npm run db:seed
```

## Cấu trúc mã nguồn chính

- `data/seed/`: Bộ dữ liệu Excel nguồn (`hardware_seed_data.xlsx`, `legacy_seed_data.xlsx`) và `320` ảnh sản phẩm gốc (`data/seed/images/`).
- `src/app/`: Next.js App Router pages & REST Route Handlers (`/api/*`).
- `src/features/`: Các module theo nghiệp vụ (`home`, `catalog`, `compare`, `search`, `cart`, `checkout`, `orders`, `admin`, `layout/components/*`, `tools/*`).
- `src/server/`: Tầng server (`server-only`) gồm `domain/`, `services/`, `db/`, `auth/`, `storage/`, `http/`.
- `tests/`: Unit & Docker PostgreSQL integration tests (`auth/`, `client/`, `domain/`, `infra/`, `services/`).

### 2. Chạy ứng dụng

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

### 3. Kiểm tra chất lượng mã nguồn & build

```bash
npm run typecheck
npm run lint
npm run test:coverage
npm run build
```

> **Ghi chú:** Bộ integration test (`npm run test:coverage`) chạy trên Docker PostgreSQL local (`techcore-test-db`, cổng `5433`, DB `techcore_test`).

## Tài liệu tham khảo thêm

- [Ý tưởng & Đặc tả nghiệp vụ](docs/idea.md)
- [Kiến trúc & Quy chuẩn kỹ thuật](docs/technical_solution.md)
- [Hướng dẫn nối dây UI & Design System](docs/UI_WIRING.md)
- [Tiến độ triển khai](docs/PROGRESS.md)
