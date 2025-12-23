# Rare Parfume OMS - Admin Frontend

Đây là ứng dụng frontend riêng biệt cho hệ thống quản lý bán hàng (OMS) của Rare Parfume.

## Tính năng

- **Đăng nhập bảo mật** với phân quyền Admin/Sales
- **Dashboard tổng quan** với thống kê và biểu đồ doanh thu
- **Quản lý đơn hàng** với tìm kiếm, lọc và cập nhật trạng thái
- **Quản lý sản phẩm** (chỉ dành cho Admin)
- **Tạo đơn hàng** với modal chọn sản phẩm thông minh
- **Responsive design** cho mọi thiết bị

## Cài đặt và Chạy

### Điều kiện tiên quyết

- Node.js (phiên bản 14 hoặc cao hơn)
- npm hoặc yarn

### Cài đặt

```bash
cd frontend/admin
npm install
```

### Chạy ứng dụng

```bash
npm start
```

Ứng dụng sẽ chạy trên `http://localhost:3001`

### Build production

```bash
npm run build
```

## Cấu trúc thư mục

```
frontend/admin/
├── public/                 # Static files
│   └── index.html         # HTML template
├── src/
│   ├── components/        # Reusable components
│   ├── pages/             # Page components
│   │   ├── AdminLoginPage.js
│   │   ├── AdminDashboardPage.js
│   │   ├── AdminOrdersPage.js
│   │   └── AdminProductsPage.js
│   ├── services/          # API services
│   │   └── api.js
│   ├── styles/            # Additional styles
│   ├── utils/             # Utility functions
│   ├── context/           # React contexts
│   ├── App.js             # Main app component
│   └── index.js           # Entry point
├── package.json           # Dependencies
└── README.md             # Documentation
```

## Phân quyền

### Admin (Quản trị viên)
- Toàn quyền truy cập tất cả chức năng
- Quản lý sản phẩm (thêm, sửa, xóa)
- Quản lý đơn hàng với quyền xóa
- Xem tất cả thống kê và báo cáo

### Sales (Nhân viên bán hàng)
- Quyền truy cập giới hạn
- Chỉ xem và cập nhật trạng thái đơn hàng
- Không thể truy cập quản lý sản phẩm
- Tạo đơn hàng mới

## API Integration

Ứng dụng sử dụng các API endpoints sau:

- `POST /api/admin/login` - Đăng nhập
- `GET /api/admin/dashboard` - Lấy dữ liệu dashboard
- `GET /api/admin/orders` - Lấy danh sách đơn hàng
- `PUT /api/admin/orders/:id` - Cập nhật trạng thái đơn hàng
- `GET /api/admin/products` - Lấy danh sách sản phẩm
- `POST /api/admin/products` - Tạo sản phẩm mới
- `PUT /api/admin/products/:id` - Cập nhật sản phẩm
- `DELETE /api/admin/products/:id` - Xóa sản phẩm

## Môi trường

Các biến môi trường cần thiết:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Development

### Scripts có sẵn

- `npm start` - Chạy development server
- `npm run build` - Build cho production
- `npm test` - Chạy tests
- `npm run eject` - Eject từ Create React App

### Code Style

- Sử dụng ESLint và Prettier
- Tailwind CSS cho styling
- React Hook Form cho form handling
- React Query cho data fetching

## Deployment

Để deploy ứng dụng admin:

1. Build ứng dụng: `npm run build`
2. Copy thư mục `build` vào web server
3. Cấu hình proxy để API calls hoạt động đúng

## Troubleshooting

### Lỗi CORS
Đảm bảo backend đã cấu hình CORS cho phép requests từ admin frontend.

### Lỗi Authentication
Kiểm tra token được lưu trữ trong localStorage với key `adminToken`.

### Lỗi API
Kiểm tra console để xem lỗi chi tiết và đảm bảo backend đang chạy.
