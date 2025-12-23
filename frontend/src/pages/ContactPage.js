import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const ContactPage = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    mode: 'onTouched'
  });

  const onSubmit = async (data) => {
    try {
      const sanitizedData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          typeof value === 'string'
            ? value.replace(/[<>]/g, '').trim()
            : value
        ])
      );

      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000));

      const customerName = sanitizedData.name ? sanitizedData.name.split(' ')[0] : 'bạn';
      toast.success(`Tin nhắn đã được gửi thành công, ${customerName}! Chúng tôi sẽ phản hồi sớm nhất có thể.`);
      reset();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại.');
    }
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Địa chỉ',
      details: ['136/4 Trần Quang Diệu, Phường 14', 'Quận 3, Thành phố Hồ Chí Minh, Việt Nam']
    },
    {
      icon: Phone,
      title: 'Điện thoại & Zalo',
      details: ['093 134 68 44']
    },
    {
      icon: Mail,
      title: 'Email',
      details: ['rareproject.84@gmail.com']
    },
    {
      icon: Clock,
      title: 'Giờ làm việc',
      details: ['Thứ 2 - Thứ 6: 9:00 - 18:00', 'Thứ 7: 9:00 - 17:00', 'Chủ nhật: Nghỉ']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Liên hệ với chúng tôi</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Hãy liên hệ với chúng tôi nếu bạn có bất kỳ câu hỏi nào.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-6 sm:p-10 space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Gửi tin nhắn</h2>
              <p className="text-sm text-gray-600">Các thông tin sẽ được mã hóa khi gửi đến đội ngũ Rare Parfume.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" autoComplete="off" noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="input-label" htmlFor="contact_name">
                    Họ và tên
                  </label>
                  <input
                    id="contact_name"
                    type="text"
                    autoComplete="name"
                    maxLength={80}
                    {...register('name', { required: 'Vui lòng nhập họ và tên' })}
                    className={`input-field ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Nhập họ và tên"
                    aria-invalid={errors.name ? 'true' : 'false'}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1" role="alert">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="input-label" htmlFor="contact_email">
                    Email
                  </label>
                  <input
                    id="contact_email"
                    type="email"
                    autoComplete="email"
                    maxLength={120}
                    {...register('email', {
                      required: 'Vui lòng nhập email',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email không hợp lệ'
                      }
                    })}
                    className={`input-field ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Nhập email"
                    aria-invalid={errors.email ? 'true' : 'false'}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1" role="alert">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="input-label" htmlFor="contact_phone">
                  Số điện thoại <span className="text-gray-400 font-normal">(tùy chọn)</span>
                </label>
                <input
                  id="contact_phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength={11}
                  {...register('phone', {
                    pattern: {
                      value: /^[0-9]{10,11}$/,
                      message: 'Số điện thoại không hợp lệ'
                    }
                  })}
                  className={`input-field ${errors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Nhập số điện thoại"
                  aria-invalid={errors.phone ? 'true' : 'false'}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1" role="alert">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="input-label" htmlFor="contact_subject">
                  Chủ đề
                </label>
                <select
                  id="contact_subject"
                  {...register('subject', { required: 'Vui lòng chọn chủ đề' })}
                  className={`input-field ${errors.subject ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  aria-invalid={errors.subject ? 'true' : 'false'}
                >
                  <option value="">Chọn chủ đề</option>
                  <option value="general">Câu hỏi chung</option>
                  <option value="product">Hỏi về sản phẩm</option>
                  <option value="order">Hỏi về đơn hàng</option>
                  <option value="shipping">Vận chuyển</option>
                  <option value="return">Đổi trả</option>
                  <option value="other">Khác</option>
                </select>
                {errors.subject && (
                  <p className="text-red-500 text-sm mt-1" role="alert">{errors.subject.message}</p>
                )}
              </div>

              <div>
                <label className="input-label" htmlFor="contact_message">
                  Tin nhắn
                </label>
                <textarea
                  id="contact_message"
                  {...register('message', { required: 'Vui lòng nhập tin nhắn', minLength: { value: 10, message: 'Tin nhắn quá ngắn' } })}
                  className={`input-field min-h-[160px] ${errors.message ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  rows={5}
                  placeholder="Nhập tin nhắn của bạn..."
                  aria-invalid={errors.message ? 'true' : 'false'}
                />
                {errors.message && (
                  <p className="text-red-500 text-sm mt-1" role="alert">{errors.message.message}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full btn-primary"
              >
                <Send className="w-5 h-5" />
                <span>Gửi tin nhắn</span>
              </button>
            </form>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-8"
          >
            {/* Contact Info Cards */}
            <div className="space-y-6">
              {contactInfo.map((info, index) => {
                const Icon = info.icon;
                return (
                  <motion.div
                    key={info.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="bg-white rounded-xl shadow-lg p-6"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">{info.title}</h3>
                        <div className="space-y-1">
                          {info.details.map((detail, idx) => (
                            <p key={idx} className="text-gray-600">{detail}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Map Placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h3 className="font-semibold text-gray-900 mb-4">Vị trí cửa hàng</h3>
              <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-2" />
                  <p>Bản đồ Google Maps</p>
                  <p className="text-sm">136/4 Trần Quang Diệu, Phường 14, Quận 3, TP.HCM</p>
                </div>
              </div>
            </motion.div>

            {/* FAQ Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h3 className="font-semibold text-gray-900 mb-4">Câu hỏi thường gặp</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Thời gian giao hàng?</h4>
                  <p className="text-sm text-gray-600">
                    Chúng tôi giao hàng trong 2-5 ngày làm việc tại TP.HCM và 3-7 ngày tại các tỉnh thành khác.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Chính sách đổi trả?</h4>
                  <p className="text-sm text-gray-600">
                    Bạn có thể đổi trả sản phẩm trong vòng 7 ngày kể từ ngày nhận hàng với điều kiện sản phẩm còn nguyên vẹn.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Phương thức thanh toán?</h4>
                  <p className="text-sm text-gray-600">
                    Chúng tôi hỗ trợ thanh toán qua QR Code, chuyển khoản ngân hàng và tiền mặt khi nhận hàng.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
