# Trạm Chuyển Mặt (`tram-chuyen-mat`)

> **Công cụ chuyển đổi diện mạo, mã QR nặn mặt Nghịch Thủy Hàn từ bản Trung sang bản Global / VN.**

Hỗ trợ chuyển đổi nhanh chóng dữ liệu diện mạo khuôn mặt, trang điểm, nhuộm thời trang (tóc, áo, quần) và góc chụp ảnh giữa các phiên bản game Nghịch Thủy Hàn (Justice Online).

---

## ✨ Tính năng chính

- 🎭 **QR Mặt (Diện mạo & Ngũ quan):** Nhận diện và chuyển đổi thông số nặn mặt từ server Trung Quốc sang server Global / VNG.
- 💄 **Trang điểm:** Chuyển đổi màu son, phấn mắt, lông mày, thần thái.
- 🎨 **Nhuộm màu (Tóc, Áo & Quần):** Tự động bóc tách và tạo mã QR nhuộm ngoại trang tương thích.
- 📷 **Chụp ảnh:** Chuyển đổi thông số đoàn phim, góc máy, ánh sáng.
- 📖 **Cẩm nang & Hướng dẫn:** Hướng dẫn chi tiết từng bước quét mã và nhập vào game.
- 📱 **Giao diện Wuxia hiện đại:** Tối ưu mượt mà cho cả máy tính và điện thoại.

---

## 🛠️ Công nghệ sử dụng

- **React 19** + **Vite**
- **Tailwind CSS v4**
- **jsQR** & **qrcode** (Xử lý quét và xuất ảnh QR code trực tiếp trên trình duyệt)
- **Cloudflare Pages Functions** (Hỗ trợ proxy API / xử lý ảnh)

---

## 🚀 Cài đặt & Khởi chạy cục bộ

```bash
# Cài đặt thư viện
npm install

# Khởi chạy môi trường phát triển (Port 8080)
npm run dev

# Đóng gói sản phẩm (Build production)
npm run build
```

---

## 📄 Bản quyền & Tuyên bố miễn trừ

Dự án phục vụ mục đích tiện ích phi thương mại cho cộng đồng người chơi Nghịch Thủy Hàn. Mọi hình ảnh và tài sản liên quan đến thương hiệu trò chơi thuộc về NetEase Games / VNGGames.
