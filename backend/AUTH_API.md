# API xác thực

Tất cả đường dẫn nằm dưới `/api`. Dữ liệu gửi và nhận là JSON.

## Cơ chế token

- **Access token**: sống 15 phút (`JWT_ACCESS_EXPIRES`). Gửi trong header `Authorization: Bearer <token>`. Frontend chỉ giữ trong bộ nhớ (biến), không lưu `localStorage`.
- **Refresh token**: sống 7 ngày (`JWT_REFRESH_EXPIRES`). Server đặt trong cookie `refresh_token` (HttpOnly, SameSite=Strict, Path=/api/auth). JavaScript không đọc được; trình duyệt tự gửi khi gọi `/api/auth/*`.
- Mỗi lần `refresh`, token cũ bị hủy và cấp token mới (xoay vòng). Nếu một token cũ bị dùng lại sau hơn 10 giây, cả phiên đăng nhập đó bị thu hồi.
- Frontend phải gọi API với `credentials: 'include'` (fetch) hoặc `withCredentials: true` (axios), và chỉ gọi refresh một lần tại một thời điểm.

## Endpoint

| Method | Đường dẫn | Cần access token | Mô tả |
|---|---|---|---|
| POST | `/auth/register` | không | Đăng ký (bước 1 bắt buộc, bước 2 tùy chọn) |
| POST | `/auth/login` | không | Đăng nhập |
| POST | `/auth/refresh` | không (dùng cookie) | Lấy access token mới |
| POST | `/auth/logout` | không (dùng cookie) | Đăng xuất thiết bị hiện tại |
| POST | `/auth/change-password` | có | Đổi mật khẩu, thu hồi mọi phiên cũ |
| GET | `/users/me` | có | Thông tin tài khoản |
| POST | `/users/me/onboarding` | có | Thiết lập ban đầu cho người đã bỏ qua bước 2 |

## Đăng ký

```json
POST /api/auth/register
{
  "fullName": "Lê Anh Khoa",
  "email": "khoa@example.com",
  "password": "Matkhau-Tai-Chinh-2026",
  "setup": {                         // bỏ trống nếu "Bỏ qua, thiết lập sau"
    "wallet": { "name": "Tiền mặt", "type": "cash", "balance": 1500000 },
    "monthlyIncome": 12000000,       // tùy chọn
    "cycleStartDay": 5,              // tùy chọn, 1 đến 28, mặc định 1
    "currency": "VND"                // tùy chọn: VND, USD, EUR; mặc định VND
  }
}
```

Trả về `201`: `{ accessToken, expiresIn, user, wallet }` và đặt cookie refresh token. `wallet` là `null` nếu bỏ qua bước 2. `wallet.type` là một trong `cash`, `bank`, `e_wallet`.

Quy tắc mật khẩu: 10 ký tự trở lên, tối đa 72 byte, không nằm trong danh sách mật khẩu phổ biến, không trùng email.

## Mã lỗi

| Mã | Khi nào |
|---|---|
| 400 | Dữ liệu sai. `message` là mảng các câu báo lỗi tiếng Việt, hoặc một chuỗi |
| 401 | Thiếu hoặc sai token, sai email hoặc mật khẩu (`Email hoặc mật khẩu không đúng`), refresh token hết hạn hoặc đã bị thu hồi |
| 409 | Email đã đăng ký; đã thiết lập ban đầu rồi |
| 429 | Thao tác quá nhanh. Đăng nhập và đăng ký: 10 lần mỗi phút mỗi IP |

## Cơ sở dữ liệu thay đổi so với ERD

- `users`: thêm `currency`, `monthly_income`, `cycle_start_day`, `onboarding_completed`.
- Bảng mới `refresh_tokens`: `id`, `user_id`, `token_hash` (băm SHA-256, không lưu token gốc), `family_id`, `expires_at`, `revoked_at`, `created_at`.
- `categories` có `user_id` để trống là danh mục mặc định dùng chung, tạo một lần khi server khởi động lần đầu (11 danh mục).
- Số dư ban đầu của ví chính là giá trị `wallets.balance` lúc tạo.
