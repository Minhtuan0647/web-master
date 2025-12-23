# API Documentation - Create Order

## POST /api/orders

Tạo đơn hàng mới và tự động ghi nhận/cập nhật thông tin khách hàng.

### Mô tả

API này sẽ:
1. Xác thực thông tin sản phẩm và số lượng tồn kho
2. Tạo hoặc cập nhật thông tin khách hàng trong bảng `customers`
3. Tạo đơn hàng mới trong bảng `orders`
4. Tạo các mục đơn hàng trong bảng `order_items`
5. Cập nhật số lượng tồn kho của sản phẩm
6. Tự động cập nhật VIP status dựa trên tổng chi tiêu

### Request Body

#### Required Fields

```json
{
  "customer_name": "Nguyễn Văn A",
  "customer_email": "nguyenvana@example.com",
  "customer_phone": "0912345678",
  "shipping_address": "123 Đường ABC, Phường XYZ, Quận 1, TP.HCM",
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    },
    {
      "product_id": 3,
      "quantity": 1
    }
  ]
}
```

#### Optional Fields

```json
{
  "payment_method": "qr_code",  // Default: "qr_code"
  "notes": "Giao hàng vào buổi sáng",
  "city": "Hồ Chí Minh",
  "country": "Vietnam",  // Default: "Vietnam"
  "date_of_birth": "1990-01-15",  // ISO 8601 format
  "gender": "male"  // Options: "male", "female", "other"
}
```

### Validation Rules

- `customer_name`: Bắt buộc, độ dài 2-255 ký tự
- `customer_email`: Bắt buộc, định dạng email hợp lệ
- `customer_phone`: Bắt buộc, độ dài 10-20 ký tự
- `shipping_address`: Bắt buộc, tối thiểu 10 ký tự
- `items`: Bắt buộc, mảng có ít nhất 1 phần tử
- `items[].product_id`: Bắt buộc, số nguyên dương
- `items[].quantity`: Bắt buộc, số nguyên dương
- `payment_method`: Tùy chọn, chuỗi
- `notes`: Tùy chọn, chuỗi
- `city`: Tùy chọn, chuỗi tối đa 100 ký tự
- `country`: Tùy chọn, chuỗi tối đa 100 ký tự
- `date_of_birth`: Tùy chọn, định dạng ISO 8601
- `gender`: Tùy chọn, một trong: "male", "female", "other"

### Response

#### Success (201 Created)

```json
{
  "message": "Order created successfully",
  "order": {
    "id": 1,
    "order_number": "RP123456789",
    "customer_name": "Nguyễn Văn A",
    "customer_email": "nguyenvana@example.com",
    "customer_phone": "0912345678",
    "shipping_address": "123 Đường ABC, Phường XYZ, Quận 1, TP.HCM",
    "total_amount": "1500000.00",
    "status": "pending",
    "payment_method": "qr_code",
    "notes": null,
    "created_at": "2024-01-15 10:30:00",
    "updated_at": "2024-01-15 10:30:00",
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "quantity": 2,
        "price_at_purchase": "500000.00",
        "product_name": "Nước hoa Chanel No.5",
        "product_image": "https://example.com/image.jpg"
      },
      {
        "id": 2,
        "product_id": 3,
        "quantity": 1,
        "price_at_purchase": "500000.00",
        "product_name": "Nước hoa Dior Sauvage",
        "product_image": "https://example.com/image2.jpg"
      }
    ]
  }
}
```

#### Error (400 Bad Request)

```json
{
  "errors": [
    {
      "msg": "Invalid value",
      "param": "customer_email",
      "location": "body"
    }
  ]
}
```

#### Error (400 Bad Request - Product not found)

```json
{
  "error": "Product with ID 999 not found"
}
```

#### Error (400 Bad Request - Insufficient stock)

```json
{
  "error": "Insufficient stock for product: Nước hoa Chanel No.5"
}
```

### VIP Status Logic

Hệ thống tự động cập nhật VIP status dựa trên tổng chi tiêu:

- **standard**: < 10,000,000 VND
- **silver**: >= 10,000,000 VND
- **gold**: >= 25,000,000 VND
- **platinum**: >= 50,000,000 VND
- **diamond**: > 70,000,000 VND

### Customer Management

- Nếu khách hàng chưa tồn tại (dựa trên email), hệ thống sẽ tạo mới
- Nếu khách hàng đã tồn tại, hệ thống sẽ:
  - Cập nhật thông tin cơ bản (tên, số điện thoại, địa chỉ)
  - Cập nhật các trường tùy chọn nếu được cung cấp
  - Tăng `total_orders` lên 1
  - Cộng dồn `total_spent` với giá trị đơn hàng mới
  - Tự động cập nhật VIP status

### Example Request

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Nguyễn Văn A",
    "customer_email": "nguyenvana@example.com",
    "customer_phone": "0912345678",
    "shipping_address": "123 Đường ABC, Phường XYZ, Quận 1, TP.HCM",
    "city": "Hồ Chí Minh",
    "country": "Vietnam",
    "items": [
      {
        "product_id": 1,
        "quantity": 2
      }
    ],
    "payment_method": "qr_code",
    "notes": "Giao hàng vào buổi sáng"
  }'
```

### Notes

- Tất cả các thao tác được thực hiện trong một transaction để đảm bảo tính nhất quán dữ liệu
- Nếu có lỗi xảy ra ở bất kỳ bước nào, toàn bộ transaction sẽ được rollback
- Số lượng tồn kho sẽ được giảm tự động khi đơn hàng được tạo thành công
- Order number được tự động tạo theo format: `RP{timestamp}{random}`

