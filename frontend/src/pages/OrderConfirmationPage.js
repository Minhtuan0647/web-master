import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, Clock, MapPin } from 'lucide-react';
import { useQuery } from 'react-query';
import { fetchOrder } from '../services/api';

const OrderConfirmationPage = () => {
  const { orderNumber } = useParams();
  const { data: order, isLoading, error } = useQuery(
    ['order', orderNumber],
    () => fetchOrder(orderNumber),
    {
      enabled: !!orderNumber,
    }
  );

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }),
    []
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Đơn hàng không tồn tại</h2>
          <p className="text-gray-600">Không thể tìm thấy đơn hàng với mã số này.</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'Chờ xử lý',
      paid: 'Đã thanh toán',
      shipped: 'Đang giao hàng',
      delivered: 'Đã giao hàng',
      cancelled: 'Đã hủy'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: 'text-yellow-600 bg-yellow-100',
      paid: 'text-blue-600 bg-blue-100',
      shipped: 'text-purple-600 bg-purple-100',
      delivered: 'text-green-600 bg-green-100',
      cancelled: 'text-red-600 bg-red-100'
    };
    return colorMap[status] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Đặt hàng thành công!
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Cảm ơn bạn đã mua sắm tại Rare Parfume
          </p>
          <p className="text-gray-600">
            Chúng tôi sẽ gửi email xác nhận đến <strong>{order.customer_email}</strong>
          </p>
        </motion.div>

        {/* Order Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Chi tiết đơn hàng</h2>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {getStatusText(order.status)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Thông tin đơn hàng</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã đơn hàng:</span>
                  <span className="font-medium">{order.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày đặt:</span>
                  <span className="font-medium">{formatDate(order.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tổng tiền:</span>
                  <span className="font-medium text-lg">{currencyFormatter.format(Number(order.total_amount || 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phương thức thanh toán:</span>
                  <span className="font-medium">QR Code</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Thông tin giao hàng</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Tên:</span>
                  <span className="font-medium ml-2">{order.customer_name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium ml-2">{order.customer_email}</span>
                </div>
                <div>
                  <span className="text-gray-600">SĐT:</span>
                  <span className="font-medium ml-2">{order.customer_phone}</span>
                </div>
                <div>
                  <span className="text-gray-600">Địa chỉ:</span>
                  <span className="font-medium ml-2">{order.shipping_address}</span>
                </div>
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Ghi chú</h3>
              <p className="text-gray-600">{order.notes}</p>
            </div>
          )}
        </motion.div>

        {/* Order Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Sản phẩm đã đặt</h2>
          
          <div className="space-y-4">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center space-x-4 py-4 border-b border-gray-200 last:border-b-0">
                <img
                  src={item.product_image || '/images/placeholder.jpg'}
                  alt={item.product_name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.product_name}</h3>
                  <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{currencyFormatter.format(Number(item.price_at_purchase || 0))}</p>
                  <p className="text-sm text-gray-600">
                    Tổng: {currencyFormatter.format(Number((item.price_at_purchase * item.quantity) || 0))}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between text-lg font-bold text-gray-900">
              <span>Tổng cộng</span>
              <span>{currencyFormatter.format(Number(order.total_amount || 0))}</span>
            </div>
          </div>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Bước tiếp theo</h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Xác nhận thanh toán</h3>
                <p className="text-sm text-gray-600">
                  Chúng tôi sẽ xác nhận thanh toán trong vòng 24 giờ
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">2</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Chuẩn bị hàng</h3>
                <p className="text-sm text-gray-600">
                  Đơn hàng sẽ được chuẩn bị và đóng gói cẩn thận
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">3</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Giao hàng</h3>
                <p className="text-sm text-gray-600">
                  Đơn hàng sẽ được giao trong 2-5 ngày làm việc
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>
                Theo dõi đơn hàng qua email: <strong>{order.customer_email}</strong>
              </span>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
        >
          <a
            href="/products"
            className="btn-primary text-center"
          >
            Tiếp tục mua sắm
          </a>
          <a
            href="/contact"
            className="btn-secondary text-center"
          >
            Liên hệ hỗ trợ
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
