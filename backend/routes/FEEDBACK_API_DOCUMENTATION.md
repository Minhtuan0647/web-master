# API Documentation - Feedback

## POST /api/feedback

Gửi phản hồi từ website (API công khai, không cần authentication).

### Mô tả

API này cho phép khách hàng gửi phản hồi, đánh giá về sản phẩm/dịch vụ từ website. Feedback sẽ được lưu vào bảng `customer_feedback` với status mặc định là `new`.

### Request Body

#### Required Fields

```json
{
  "message": "Sản phẩm rất tốt, tôi rất hài lòng!"
}
```

#### Optional Fields

```json
{
  "customer_name": "Nguyễn Văn A",
  "customer_email": "nguyenvana@example.com",
  "customer_phone": "0912345678",
  "rating": 5
}
```

### Validation Rules

- `customer_name`: Tùy chọn, độ dài 2-255 ký tự
- `customer_email`: Tùy chọn, định dạng email hợp lệ (sẽ được normalize)
- `customer_phone`: Tùy chọn, độ dài 9-20 ký tự
- `message`: **Bắt buộc**, độ dài 10-5000 ký tự
- `rating`: Tùy chọn, số nguyên từ 1-5 (đánh giá sao)

**Lưu ý**: Phải cung cấp ít nhất một trong các thông tin: `customer_name`, `customer_email`, hoặc `customer_phone`.

### Response

#### Success (201 Created)

```json
{
  "message": "Cảm ơn bạn đã gửi phản hồi! Chúng tôi sẽ xem xét và phản hồi sớm nhất có thể.",
  "success": true,
  "feedback": {
    "id": 1,
    "customer_name": "Nguyễn Văn A",
    "customer_email": "nguyenvana@example.com",
    "customer_phone": "0912345678",
    "message": "Sản phẩm rất tốt, tôi rất hài lòng!",
    "rating": 5,
    "status": "new",
    "created_at": "2024-01-15 10:30:00"
  }
}
```

#### Error (400 Bad Request - Validation Error)

```json
{
  "error": "Dữ liệu không hợp lệ",
  "errors": [
    {
      "msg": "Nội dung phản hồi phải có từ 10-5000 ký tự",
      "param": "message",
      "location": "body"
    }
  ]
}
```

#### Error (400 Bad Request - Missing Contact Info)

```json
{
  "error": "Vui lòng cung cấp ít nhất một thông tin liên hệ (tên, email hoặc số điện thoại)"
}
```

#### Error (500 Internal Server Error)

```json
{
  "error": "Không thể gửi phản hồi. Vui lòng thử lại sau."
}
```

### Example Request

```bash
curl -X POST http://localhost:5000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Nguyễn Văn A",
    "customer_email": "nguyenvana@example.com",
    "customer_phone": "0912345678",
    "message": "Sản phẩm rất tốt, chất lượng cao và mùi hương tuyệt vời. Tôi sẽ quay lại mua tiếp!",
    "rating": 5
  }'
```

### Example Request (Minimal)

```bash
curl -X POST http://localhost:5000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "customer_email": "nguyenvana@example.com",
    "message": "Sản phẩm rất tốt, tôi rất hài lòng!"
  }'
```

---

## GET /api/feedback

Lấy danh sách phản hồi đã được duyệt để hiển thị trên website (testimonials).

### Query Parameters

- `limit` (optional): Số lượng feedback muốn lấy (mặc định: 10, tối đa: 50)
- `rating` (optional): Lọc theo đánh giá (1-5 sao)

### Response

#### Success (200 OK)

```json
{
  "success": true,
  "count": 5,
  "feedbacks": [
    {
      "id": 1,
      "customer_name": "Nguyễn Văn A",
      "message": "Sản phẩm rất tốt, chất lượng cao và mùi hương tuyệt vời.",
      "rating": 5,
      "created_at": "2024-01-15 10:30:00"
    },
    {
      "id": 2,
      "customer_name": "Trần Thị B",
      "message": "Dịch vụ giao hàng nhanh, đóng gói cẩn thận.",
      "rating": 4,
      "created_at": "2024-01-14 15:20:00"
    }
  ]
}
```

### Example Request

```bash
# Get latest 10 feedbacks
curl http://localhost:5000/api/feedback

# Get feedbacks with 5-star rating
curl http://localhost:5000/api/feedback?rating=5

# Get 20 feedbacks
curl http://localhost:5000/api/feedback?limit=20
```

### Notes

- API này chỉ trả về các feedback có status = `resolved` (đã được admin duyệt)
- Thông tin email và số điện thoại không được trả về trong GET endpoint để bảo vệ privacy
- Tên khách hàng sẽ được hiển thị là "Khách hàng" nếu không có tên

---

## Feedback Status Flow

1. **new**: Feedback mới được gửi từ website (mặc định)
2. **in_progress**: Admin đang xử lý feedback
3. **resolved**: Feedback đã được xử lý và có thể hiển thị công khai
4. **archived**: Feedback đã được lưu trữ

### Workflow

```
Website → POST /api/feedback → Status: "new"
         ↓
Admin Panel → Review & Update → Status: "in_progress" → "resolved"
         ↓
Website → GET /api/feedback → Only shows "resolved" feedbacks
```

---

## Security & Rate Limiting

- API này là công khai, không cần authentication
- Rate limiting được áp dụng ở server level (100 requests per 15 minutes per IP)
- Email được normalize (chuyển về lowercase) để tránh duplicate
- Input được validate và sanitize để tránh XSS và SQL injection

---

## Integration Example (JavaScript/React)

```javascript
// Submit feedback
const submitFeedback = async (formData) => {
  try {
    const response = await fetch('http://localhost:5000/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        message: formData.message,
        rating: formData.rating
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      alert(data.message); // "Cảm ơn bạn đã gửi phản hồi!..."
      return { success: true, data };
    } else {
      throw new Error(data.error || 'Có lỗi xảy ra');
    }
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return { success: false, error: error.message };
  }
};

// Get testimonials
const getTestimonials = async (limit = 10) => {
  try {
    const response = await fetch(`http://localhost:5000/api/feedback?limit=${limit}`);
    const data = await response.json();
    
    if (response.ok) {
      return data.feedbacks;
    } else {
      throw new Error(data.error || 'Có lỗi xảy ra');
    }
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
};
```

