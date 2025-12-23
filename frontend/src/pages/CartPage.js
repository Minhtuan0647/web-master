import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Shield } from 'lucide-react';
import { useCart } from '../context/CartContext';

const CartPage = () => {
  const { items, removeFromCart, updateQuantity, getTotalPrice, getTotalItems, clearCart } = useCart();

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }),
    []
  );

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center">
            <div className="text-gray-400 mb-8">
              <ShoppingBag className="w-24 h-24 mx-auto" />
            </div>
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">Giỏ hàng trống</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá các sản phẩm tuyệt vời của chúng tôi!
            </p>
            <Link to="/products" className="btn-primary inline-flex items-center space-x-2">
              <span>Khám phá sản phẩm</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mb-2">Giỏ hàng</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Bạn có {getTotalItems()} sản phẩm trong giỏ hàng
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base line-clamp-2">{item.name}</h3>
                    <p className="text-sm text-gray-600 mb-1">{item.brand}</p>
                    <p className="text-xs text-gray-500">{item.volume_ml}ml</p>
                    <div className="mt-2 sm:hidden">
                      <p className="font-semibold text-gray-900 text-base">{currencyFormatter.format(Number(item.price || 0))}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Tổng: {currencyFormatter.format(Number((item.price * item.quantity) || 0))}
                      </p>
                    </div>
                  </div>

                  {/* Price - Desktop */}
                  <div className="hidden sm:block text-right flex-shrink-0">
                    <p className="font-semibold text-gray-900 text-lg">{currencyFormatter.format(Number(item.price || 0))}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Tổng: {currencyFormatter.format(Number((item.price * item.quantity) || 0))}
                    </p>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 pt-4 border-t border-gray-200 gap-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-700">Số lượng:</span>
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="p-2 hover:bg-gray-100 transition-colors rounded-l-lg"
                        aria-label="Giảm số lượng"
                      >
                        <Minus className="w-4 h-4 text-gray-700" />
                      </button>
                      <span className="px-4 py-2 min-w-[50px] text-center text-sm font-medium text-gray-900 bg-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="p-2 hover:bg-gray-100 transition-colors rounded-r-lg"
                        aria-label="Tăng số lượng"
                      >
                        <Plus className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-300 self-start sm:self-auto"
                    aria-label="Xóa sản phẩm"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}

            {/* Clear Cart Button */}
            {items.length > 0 && (
              <div className="text-center pt-2">
                <button
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700 font-medium text-sm transition-colors duration-300"
                >
                  Xóa tất cả sản phẩm
                </button>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sticky top-24 space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-serif font-bold text-gray-900">Tóm tắt đơn hàng</h2>
                <p className="text-sm text-gray-600">{getTotalItems()} sản phẩm</p>
              </div>

              {/* Order Details */}
              <div className="space-y-3 border-b border-gray-200 pb-4">
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Tạm tính ({getTotalItems()} sản phẩm)</span>
                  <span className="font-medium">{currencyFormatter.format(Number(getTotalPrice() || 0))}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Phí vận chuyển</span>
                  <span className="font-medium text-emerald-600">Miễn phí</span>
                </div>
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Thuế</span>
                  <span className="font-medium">{currencyFormatter.format(0)}</span>
                </div>
              </div>

              {/* Total */}
              <div className="pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Tổng cộng</span>
                  <span className="text-xl font-bold text-amber-600">{currencyFormatter.format(Number(getTotalPrice() || 0))}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Link
                to="/checkout"
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                <span>Tiến hành thanh toán</span>
                <ArrowRight className="w-5 h-5" />
              </Link>

              {/* Continue Shopping */}
              <Link
                to="/products"
                className="w-full btn-secondary flex items-center justify-center space-x-2"
              >
                <span>Tiếp tục mua sắm</span>
              </Link>

              {/* Security Notice */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-start space-x-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <Shield className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">Thanh toán an toàn</p>
                    <p className="text-xs text-emerald-700 mt-1">
                      Thông tin của bạn được bảo mật và mã hóa
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
