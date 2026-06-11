# TaskCommit — Tài liệu onboarding cho agent

App quản lý bài tập đại học theo **tâm lý học hành vi (loss aversion)**: sinh viên nạp điểm vào ví, cọc điểm khi tạo lộ trình, hoàn điểm nếu hoàn thành task đúng hạn, mất vĩnh viễn nếu quá hạn.

**Không có database.** MVP dùng file JSON + upload local. **Không có auth** (single-user local app).

---

## Stack

| Layer | Công nghệ |
|-------|-----------|
| Framework | Next.js 16 App Router |
| UI | React 19, Tailwind CSS 4, lucide-react |
| AI | `@google/generative-ai` — model `gemini-2.5-flash` (env `GEMINI_MODEL`) |
| Math | KaTeX qua `components/MathText.tsx` |
| Thanh toán | `sepay-pg-node` — QR/chuyển khoản VND |
| Ngôn ngữ mặc định | **Tiếng Việt** (`context/LanguageContext.tsx`, `useState("vi")`) |

UI gốc migrate từ Figma Make app trong `temp/University Assignment Management App/` — **chỉ tham khảo**, code thật nằm ở `components/`, `app/`. Folder `temp/` bị exclude khỏi TS build.

---

## Routes (pages)

| URL | Mô tả |
|-----|--------|
| `/` | Dashboard — task đang active, thống kê ví |
| `/create` | Tạo bài tập mới (upload PDF, Gemini sinh lộ trình) |
| `/roadmap/all` | Danh sách tất cả lộ trình + **xóa lộ trình** |
| `/roadmap/[assignmentId]` | Chi tiết 1 lộ trình + timeline |
| `/roadmap/[assignmentId]/task/[taskId]` | Hoàn thành task (upload note + quiz) |
| `/deposit` | Kho điểm — nạp tiền SePay, lịch sử giao dịch |
| `/payment/sepay-success` | Redirect sau thanh toán — sync order + cộng điểm |
| `/payment/sepay-error` | Thanh toán thất bại / hủy |

Layout dashboard: `app/(dashboard)/layout.tsx` → `components/Layout.tsx` (sidebar + header).

---

## API routes

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/api/assignments` | List assignments (chạy `processOverdueTasks` trước) |
| POST | `/api/assignments` | Tạo assignment (FormData: subject, finalDeadline, difficulty, depositPoints, lecturePdfs[]) |
| GET | `/api/assignments/[id]` | Chi tiết assignment |
| DELETE | `/api/assignments/[id]` | Xóa lộ trình + refund điểm (xem mục Delete) |
| GET/PUT | `/api/assignments/[id]/tasks/[taskId]/progress` | Đọc/lưu tiến độ quiz answers |
| POST | `/api/assignments/[id]/tasks/[taskId]/notes` | Upload file note |
| POST | `/api/assignments/[id]/tasks/[taskId]/quiz` | Generate quiz Gemini (10 câu). `?regenerate=true` để tạo lại |
| POST | `/api/assignments/[id]/tasks/[taskId]/complete` | Nộp quiz + hoàn thành task |
| GET | `/api/wallet` | Số dư + stats ví |
| GET | `/api/billing/config` | Cấu hình SePay + danh sách gói nạp |
| POST | `/api/billing/sepay/create-checkout` | Tạo order PENDING + form fields SePay |
| POST | `/api/billing/sepay/ipn` | IPN webhook SePay (xác thực Secret Key header) |
| GET | `/api/billing/orders/[orderInvoiceNumber]` | Trạng thái order |
| POST | `/api/billing/orders/[orderInvoiceNumber]` | **Sync** order với SePay API (fallback khi IPN không tới localhost) |

Client fetch helpers: `lib/api-client.ts`. Submit form SePay: `lib/sepayCheckout.ts`.

---

## Lưu trữ dữ liệu (không DB)

```
data/
  assignments.json          # Tất cả bài tập + milestones
  wallet.json               # Số dư, lost, reclaimed, transactions
  orders.json               # Order thanh toán SePay
  task-progress/{assignmentId}-{taskId}.json   # Notes, quiz answers, history
  quizzes/{assignmentId}-{taskId}.json         # Quiz session (có correctIndex server-side)

uploads/
  lectures/{assignmentId}-{i}-{filename}.pdf
  notes/{assignmentId}-{taskId}-{timestamp}.ext
```

---

## Domain model

### Assignment
- `id`, `subject`, `title` (= subject), `finalDeadline`, `difficulty` (1–5)
- `depositPoints` / `totalPoints` — tổng điểm cọc khi tạo
- `lecturePdfPaths: string[]`
- `tasks: Milestone[]`

### Milestone (task)
- `status`: `locked` → `upcoming` → `active` → `completed` | `forfeited`
- `pointsDeposited` — điểm cọc riêng milestone (phân bổ tăng dần)
- `deadline` — timestamp thật, **không làm tròn** khi hiển thị (`lib/timeFormat.ts`)
- `description` — bullet lines (`\n`) hoặc auto-tách câu qua `components/TaskDescription.tsx`

### Wallet transaction types
| type | Ý nghĩa |
|------|---------|
| `deposit` | Trừ ví khi tạo assignment (label = tên môn) |
| `reclaim` | Hoàn điểm khi hoàn thành task đúng hạn |
| `loss` | Task quá hạn — cộng vào `wallet.lost`, **không** trả balance |
| `topup` | Nạp tiền SePay |
| `refund` | Hoàn điểm khi xóa lộ trình (task chưa forfeited/completed) |

---

## Luồng nghiệp vụ chính

### 1. Tạo bài tập (`POST /api/assignments`)
**Input:** tên môn, hạn chót (chỉ ngày → lưu `T23:59:59`), mức khó 1–5, số điểm cọc (slider), ≥1 file PDF bài giảng.

**Mức độ khó** quyết định **số milestone** (không ảnh hưởng quiz hay số tiền nạp):

| Khó | Milestones |
|-----|------------|
| 1 | 3 |
| 2 | 4 |
| 3 | 5 |
| 4 | 6 |
| 5 | 8 |

**Pipeline:**
1. Upload PDF → `uploads/lectures/`
2. Gemini đọc PDF → sinh đúng N milestone (title + description bullet)
3. `distributePoints()` — chia điểm cọc tăng dần theo công thức `(i+1)^1.4`
4. `scheduleDeadlines()` — deadline giữa now và finalDeadline (power factor 0.8)
5. Task 1 = `active`, task 2 = `upcoming`, còn lại = `locked`
6. `deductDeposit(depositPoints, subject)` — trừ ví ngay
7. Lưu `assignments.json`

Code: `lib/gemini.ts`, `lib/pointDistribution.ts`, `app/api/assignments/route.ts`.

### 2. Quá hạn (`lib/overdue.ts`)
Gọi `processOverdueTasks()` trước mọi GET assignments/wallet.

Task `active` hoặc `upcoming` quá `deadline`:
- → `forfeited`
- `forfeitPoints()` — tăng `wallet.lost`
- Task kế tiếp `locked` → `upcoming`

### 3. Hoàn thành task
**Điều kiện:** task `active`, chưa quá deadline, ≥1 file note upload, quiz **≥7/10** đúng.

**Flow:** `components/TaskComplete.tsx`
1. Upload notes → lưu ngay `task-progress`
2. Bấm hoàn thành → Gemini sinh 10 câu quiz (cache trong progress + `data/quizzes/`)
3. Submit → `gradeQuiz()` → nếu pass: `completeTask()` → `reclaimPoints()`, task → `completed`, unlock task tiếp theo

### 4. Nạp điểm SePay (`/deposit`)
- **Quy đổi: 100 VND = 1 point** (`lib/paymentPlans.ts`, `VND_PER_POINT = 100`)
- Gói: 100 / 250 / 500 / 1000 điểm → 10k / 25k / 50k / 100k VND
- FE gọi create-checkout → submit form POST ẩn tới SePay sandbox
- IPN `ORDER_PAID` → `fulfillPaidOrder()` idempotent
- **Localhost:** IPN không tới được → trang success gọi `POST /api/billing/orders/[id]` sync qua `client.order.retrieve()`

Code: `lib/sepay.ts`, `lib/orders.ts`, `lib/wallet.ts` (`topUpPoints`).

### 5. Xóa lộ trình (`DELETE /api/assignments/[id]`, UI tại `/roadmap/all`)
- Task `forfeited`: điểm **mất vĩnh viễn** (giữ trong `wallet.lost`)
- Task `completed`: đã reclaim trước đó — không refund thêm
- Task `active` / `upcoming` / `locked`: **refund** về balance (`refundPoints`)
- Xóa file liên quan (PDF, quiz, progress, notes)

Code: `lib/assignmentDelete.ts`, `lib/assignmentUtils.ts` (hàm tính refund — safe import từ client).

---

## Gemini

| Chức năng | File | Ghi chú |
|-----------|------|---------|
| Sinh roadmap từ PDF | `lib/gemini.ts` → `generateRoadmapWithGemini` | JSON milestones, prompt yêu cầu description dạng bullet `\n` |
| Sinh quiz | `lib/gemini.ts` → `generateQuizFromPdf` | 10 câu, LaTeX `$...$` cho công thức |
| Chấm quiz | `gradeQuiz()` | Pass nếu ≥7 đúng |

**Env bắt buộc:** `GEMINI_API_KEY`, tùy chọn `GEMINI_MODEL` (mặc định `gemini-2.5-flash`). Model `gemini-2.0-flash` từng 404 — không dùng.

Không có silent fallback template nếu Gemini fail — API trả lỗi 502.

---

## SePay env (`.env`)

```
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash

SEPAY_ENV=sandbox                    # hoặc production
SEPAY_MERCHANT_ID=
SEPAY_SECRET_KEY=
FRONTEND_URL=http://localhost:3000   # redirect URLs sau checkout
SEPAY_IPN_ALLOW_NO_AUTH=false        # chỉ true khi test IPN local không auth
```

**IPN URL trên my.sepay.vn:** `https://<domain>/api/billing/sepay/ipn` (đủ path `/api/...`).

Production: redirect URLs phải HTTPS public (dùng ngrok khi dev).

---

## Components quan trọng

| File | Vai trò |
|------|---------|
| `components/CreateAssignment.tsx` | Form tạo bài + upload PDF + preview phân bổ điểm |
| `components/PointDistributionPreview.tsx` | **Bar chart CSS** trên `/create`: preview cách `distributePoints()` chia điểm cọc tăng dần theo milestone (cột cao = nhiều điểm hơn; số dưới mỗi cột = điểm milestone đó). Không dùng thư viện chart. |
| `components/RoadmapView.tsx` | `/roadmap/all` và `/roadmap/[id]` — gồm section **Chiến Lược Phân Phối Điểm** (bar chart CSS cùng pattern với preview) |
| `components/RoadmapTimeline.tsx` | Timeline task + deadline chính xác |
| `components/TaskComplete.tsx` | Upload note + quiz + complete |
| `components/TaskDescription.tsx` | Render mô tả dạng bullet |
| `components/DepositPoints.tsx` | Nạp SePay + lịch sử ví |
| `components/Home.tsx` | Dashboard |
| `components/MathText.tsx` | Render LaTeX inline |
| `context/LanguageContext.tsx` | i18n EN/VI — mọi string UI qua `t.xxx` |

---

## Lib modules

| File | Vai trò |
|------|---------|
| `lib/db.ts` | CRUD assignments, upload PDF/notes, quiz sessions |
| `lib/wallet.ts` | Balance, deposit/reclaim/forfeit/topup/refund |
| `lib/overdue.ts` | Xử lý quá hạn + complete task |
| `lib/taskProgress.ts` | Persist notes/quiz/history per task |
| `lib/types.ts` | Types + DTO convert |
| `lib/timeFormat.ts` | `formatTimeRemaining` (không làm tròn ngày), `formatDeadlineDateTime` |
| `lib/paymentPlans.ts` | Gói nạp + `VND_PER_POINT` |
| `lib/sepay.ts` | Checkout, IPN, sync, `fulfillPaidOrder` idempotent |
| `lib/orders.ts` | Payment orders JSON |
| `lib/api-client.ts` | Client-side fetch wrappers |

---

## Quy ước khi sửa code

1. **Giữ scope nhỏ** — không refactor không liên quan.
2. **Không thêm DB** trừ khi user yêu cầu — pattern JSON + fs trong `lib/`.
3. **i18n:** thêm key cả `en` và `vi` trong `LanguageContext.tsx`.
4. **Điểm:** mọi thay đổi balance phải qua `lib/wallet.ts` + ghi transaction.
5. **Overdue:** nhớ gọi `processOverdueTasks()` khi load assignments/wallet.
6. **Client vs server:** logic thuần (tính refund…) đặt file không import `fs` — ví dụ `lib/assignmentUtils.ts`.
7. **Không commit `.env`** — secrets ở local only.
8. **Next.js 16** — đọc docs trong `node_modules/next/dist/docs/` nếu dùng API mới; có thể khác Next 14/15 trong training data.

---

## Chạy dev

```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # verify trước khi merge
```

Nếu port 3000 bận: kill process hoặc `npm run dev -- -p 3001` (cập nhật `FRONTEND_URL` nếu test SePay).

---

## Tính năng chưa / placeholder

- Nav **Social**, **Statistics** — có label i18n nhưng chưa có page thật.
- **Auth / multi-user** — chưa có.
- Profile user — UI placeholder trong header.
