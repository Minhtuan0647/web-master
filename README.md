# Rare Parfume - E-commerce Website

Website thương mại điện tử chuyên về nước hoa niche và cao cấp với giao diện sang trọng và hiện đại.

## 🚀 Công nghệ sử dụng

- **Frontend**: React 18 + Tailwind CSS + Framer Motion
- **Backend**: Node.js + Express.js + PostgreSQL
- **State Management**: React Query + Context API
- **UI Components**: Lucide React Icons
- **Package Manager**: npm

## 📁 Cấu trúc dự án

```
website/
├── frontend/                    # React frontend (Website bán hàng)
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   ├── pages/              # Page components
│   │   ├── context/            # React Context
│   │   ├── services/           # API services
│   │   └── App.js              # Main App component
│   ├── public/                 # Static assets
│   └── package.json
├── frontend/admin/              # React admin frontend (OMS riêng biệt)
│   ├── src/
│   │   ├── components/         # Admin components
│   │   ├── pages/              # Admin page components
│   │   ├── services/           # Admin API services
│   │   └── App.js              # Admin App component
│   ├── public/                 # Admin static assets
│   └── package.json
├── backend/                     # Node.js backend
│   ├── routes/                 # API routes
│   ├── config/                 # Database config
│   ├── server.js              # Main server file
│   └── package.json
├── database/                    # Database scripts
│   └── schema.sql             # Database schema
├── setup-database.sh          # Linux/Mac setup script
├── setup-database.bat         # Windows setup script
└── README.md
```

## 🛠️ Hướng dẫn cài đặt

### 1. Yêu cầu hệ thống
- Node.js 16+ 
- PostgreSQL 12+
- npm hoặc yarn

### 2. Cài đặt Database

#### Linux/Mac:
```bash
# Cài đặt PostgreSQL (Ubuntu/Debian)
sudo apt-get install postgresql postgresql-contrib

# Cài đặt PostgreSQL (macOS với Homebrew)
brew install postgresql

# Khởi động PostgreSQL
sudo service postgresql start  # Ubuntu/Debian
brew services start postgresql  # macOS

# Chạy script setup database
chmod +x setup-database.sh
./setup-database.sh
```

#### Windows:
```cmd
# Cài đặt PostgreSQL từ https://www.postgresql.org/download/windows/
# Sau đó chạy script setup
setup-database.bat
```

### 3. Cài đặt Backend

```bash
cd backend

# Cài đặt dependencies
npm install

# Tạo file .env từ template
cp env.example .env

# Chỉnh sửa file .env với thông tin database của bạn
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=rare_parfume
# DB_USER=postgres
# DB_PASSWORD=your_password
# ALLOWED_ORIGINS=https://rareparfume.com,https://admin.rareparfume.com
# JWT_SECRET=chuoi_bao_mat_it_nhat_32_ky_tu

# Khởi động server
npm run dev
```

### 4. Chạy ứng dụng

#### Chạy cả Website và Admin cùng lúc:

```bash
# Terminal 1: Backend
cd backend
npm install
npm start

# Terminal 2: Frontend (Website bán hàng)
cd frontend
npm install
npm start

# Terminal 3: Admin (OMS riêng biệt)
cd frontend/admin
npm install
npm start
```

Ứng dụng sẽ chạy tại:
- **Website bán hàng**: http://localhost:3000
- **Admin OMS**: http://localhost:3001
- **Backend API**: http://localhost:5000

#### Thông tin đăng nhập Admin:

**Admin (Quản trị viên):**
- Email: admin@rareparfume.com
- Mật khẩu: admin123
- Quyền: Toàn quyền truy cập tất cả chức năng

**Sales (Nhân viên bán hàng):**
- Có thể đăng nhập với role khác để test phân quyền

## 📱 Responsive Design

Website được thiết kế responsive hoàn toàn, hỗ trợ tất cả các thiết bị:

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px  
- **Desktop**: 1024px - 1280px
- **Large Desktop**: > 1280px

### Tính năng responsive
- ✅ Mobile-first design approach
- ✅ Touch-friendly interface (44px minimum touch targets)
- ✅ Responsive typography (text scales appropriately)
- ✅ Flexible grid layouts
- ✅ Optimized images for different screen densities
- ✅ Responsive navigation (hamburger menu on mobile)
- ✅ Adaptive spacing and padding
- ✅ Landscape orientation support
- ✅ Accessibility improvements (focus states, skip links)

### Mobile optimizations
- Compact header with abbreviated logo
- Collapsible navigation menu
- Stacked form layouts
- Touch-optimized buttons and inputs
- Reduced animation on mobile for better performance
- Optimized image loading

## ✨ Tính năng chính

### 🏠 Trang chủ
- Hero banner với hiệu ứng parallax
- Sản phẩm nổi bật với animation
- Câu chuyện thương hiệu
- Blog teaser
- Newsletter subscription

### 🛍️ Sản phẩm
- Tìm kiếm và lọc sản phẩm theo nhiều tiêu chí
- Chi tiết sản phẩm với gallery ảnh
- Thông tin tầng hương (Top, Middle, Base notes)
- Sản phẩm liên quan
- Đánh giá và rating

### 🛒 Giỏ hàng & Thanh toán
- Giỏ hàng với animation mượt mà
- Thanh toán qua QR Code
- Xác nhận đơn hàng
- Theo dõi trạng thái đơn hàng

### 📱 Responsive Design
- Thiết kế responsive cho mọi thiết bị
- Mobile-first approach
- Touch-friendly interface

### 👨‍💼 Admin Panel
- Dashboard với thống kê tổng quan
- Quản lý sản phẩm (CRUD)
- Quản lý đơn hàng và cập nhật trạng thái
- Giao diện admin thân thiện
- Hỗ trợ cấu hình endpoint API động qua biến môi trường `REACT_APP_API_URL`

## 🎨 Thiết kế UI/UX

- **Màu sắc**: Palette amber/gold với accent colors
- **Typography**: Inter (body) + Playfair Display (headings)
- **Animations**: Framer Motion cho smooth transitions
- **Icons**: Lucide React icons
- **Layout**: Modern grid system với Tailwind CSS

## 🔧 API Endpoints

### Products
- `GET /api/products` - Lấy danh sách sản phẩm
- `GET /api/products/:id` - Lấy chi tiết sản phẩm
- `GET /api/products/featured/list` - Sản phẩm nổi bật
- `GET /api/products/brands/list` - Danh sách thương hiệu

### Orders
- `POST /api/orders` - Tạo đơn hàng mới
- `GET /api/orders/:orderNumber` - Lấy thông tin đơn hàng
- `GET /api/orders?email=...` - Lấy đơn hàng theo email

### Admin
- `POST /api/admin/login` - Đăng nhập admin
- `GET /api/admin/orders` - Lấy tất cả đơn hàng
- `PUT /api/admin/orders/:id` - Cập nhật trạng thái đơn hàng
- `GET /api/admin/products` - Quản lý sản phẩm
- `POST /api/admin/products` - Tạo sản phẩm mới
- `PUT /api/admin/products/:id` - Cập nhật sản phẩm
- `DELETE /api/admin/products/:id` - Xóa sản phẩm

## 🚀 Deployment

### 🔐 Lưu ý bảo mật trước khi deploy
- Thiết lập biến môi trường `NODE_ENV=production` và cung cấp `JWT_SECRET` tối thiểu 32 ký tự.
- Cập nhật `ALLOWED_ORIGINS` với danh sách domain thật (ví dụ: `https://rareparfume.com,https://admin.rareparfume.com`).
- Đặt lại `ADMIN_EMAIL` và `ADMIN_PASSWORD` bằng thông tin riêng, tránh giữ giá trị mặc định.
- Bật HTTPS (ví dụ thông qua reverse proxy/Heroku SSL) để bảo vệ dữ liệu đăng nhập và thanh toán.

### Backend (Heroku)
```bash
# Tạo Heroku app
heroku create rare-parfume-api

# Thêm PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Deploy
git subtree push --prefix backend heroku main
```

### Frontend (Vercel/Netlify)
```bash
# Build production
cd frontend
# Thiết lập biến môi trường cho endpoint API trước khi build (ví dụ trên Vercel/Netlify)
# REACT_APP_API_URL=https://api.rareparfume.com/api
npm run build

# Deploy to Vercel
npx vercel --prod

# Hoặc deploy to Netlify
# Upload thư mục build/ lên Netlify
```

## 📝 Scripts hữu ích

```bash
# Backend
npm run dev          # Development server
npm start           # Production server
npm test            # Run tests

# Frontend  
npm start           # Development server
npm run build       # Production build
npm test            # Run tests
npm run eject       # Eject from Create React App
```

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Liên hệ

- **Email**: info@rareparfume.com
- **Website**: https://rareparfume.com
- **Project Link**: https://github.com/yourusername/rare-parfume

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - Frontend framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Express.js](https://expressjs.com/) - Backend framework
- [PostgreSQL](https://www.postgresql.org/) - Database
