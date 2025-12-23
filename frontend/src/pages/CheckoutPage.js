import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Check, CreditCard, Truck, Shield, Package, Building2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/api';
import toast from 'react-hot-toast';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, getTotalPrice, getTotalItems, clearCart } = useCart();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderData, setOrderData] = useState(null);

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }),
    []
  );

  const { register, handleSubmit, formState: { errors }, trigger, watch } = useForm({
    mode: 'onTouched',
    defaultValues: {
      shipping_method: 'standard',
      payment_method: 'bank_transfer'
    }
  });

  const paymentMethod = watch('payment_method');

  const steps = [
    { id: 1, title: 'Thông tin giao hàng', icon: Truck },
    { id: 2, title: 'Phương thức vận chuyển', icon: Package },
    { id: 3, title: 'Phương thức thanh toán', icon: CreditCard },
    { id: 4, title: 'Xác nhận đơn hàng', icon: Check },
  ];

  const onSubmit = async (data) => {
    if (currentStep === 1) {
      const isValidStep = await trigger(['customer_name', 'customer_phone', 'customer_email', 'shipping_address']);
      if (!isValidStep) {
        toast.error('Vui lòng kiểm tra lại thông tin giao hàng.');
        return;
      }
      setOrderData(data);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setOrderData(prev => ({
        ...prev,
        shipping_method: data.shipping_method || 'standard'
      }));
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setOrderData(prev => ({
        ...prev,
        payment_method: data.payment_method || 'bank_transfer'
      }));
      setCurrentStep(4);
    } else if (currentStep === 4) {
      await handleOrderSubmission();
    }
  };

  const handleOrderSubmission = async () => {
    if (!orderData || items.length === 0) return;

    setIsSubmitting(true);
    try {
      // Validate basic data format
      const productIds = items.map(item => parseInt(item.id, 10));
      const validProductIds = productIds.filter(id => !isNaN(id) && id > 0);
      
      if (validProductIds.length === 0) {
        throw new Error('Không có sản phẩm hợp lệ trong giỏ hàng');
      }

      // Prepare order items - backend will validate product existence
      const orderItems = items.map(item => {
        const productId = parseInt(item.id, 10);
        const quantity = parseInt(item.quantity, 10);
        
        if (isNaN(productId) || productId <= 0) {
          throw new Error(`Invalid product ID: ${item.id}`);
        }
        if (isNaN(quantity) || quantity <= 0) {
          throw new Error(`Invalid quantity: ${item.quantity}`);
        }
        
        return {
          product_id: productId,
          quantity: quantity,
        };
      });

      const orderPayload = {
        ...orderData,
        items: orderItems,
        payment_method: orderData.payment_method || 'bank_transfer',
        shipping_method: orderData.shipping_method || 'standard',
      };

      const response = await createOrder(orderPayload);
      
      if (!response || !response.order || !response.order.order_number) {
        throw new Error('Invalid response from server');
      }
      
      clearCart();
      navigate(`/order-confirmation/${response.order.order_number}`);
      
    } catch (error) {
      console.error('Error creating order:', error);
      const errorData = error.response?.data;
      
      // Display the main error message
      const errorMessage = errorData?.message || errorData?.error || error.message || 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.';
      toast.error(errorMessage, { duration: 5000 });
      
      // If product doesn't exist or cart is invalid, clear cart and redirect
      const errorText = (errorData?.error || errorData?.message || '').toLowerCase();
      if (errorText.includes('không tồn tại') || 
          errorText.includes('không còn tồn tại') ||
          errorText.includes('lỗi dữ liệu sản phẩm')) {
        setTimeout(() => {
          clearCart();
          toast('Đã xóa giỏ hàng. Vui lòng thêm lại sản phẩm.', { icon: '🛒', duration: 3000 });
          navigate('/products');
        }, 2000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/cart');
    }
  };

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={goBack}
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-amber-600 mb-4 font-medium text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">Thanh toán</h1>
            <p className="text-sm sm:text-base text-gray-600">Hoàn tất các bước bên dưới để đặt hàng an toàn với Rare Parfume.</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <React.Fragment key={step.id}>
                  <div className="flex items-center flex-1 sm:flex-initial">
                    <div className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-amber-500 border-amber-500 text-white' 
                        : isActive 
                          ? 'border-amber-500 text-amber-600 bg-amber-50' 
                          : 'border-gray-300 text-gray-400 bg-white'
                    }`}>
                      {isCompleted ? (
                        <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                      ) : (
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      )}
                    </div>
                    <div className="ml-3 hidden sm:block">
                      <p className={`text-xs sm:text-sm font-medium whitespace-nowrap ${
                        isActive ? 'text-amber-600' : isCompleted ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`hidden sm:block flex-1 h-0.5 mx-2 transition-colors duration-300 ${
                      isCompleted ? 'bg-amber-500' : 'bg-gray-300'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Step 1: Shipping Information */}
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 space-y-6"
                >
                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">Thông tin giao hàng</h2>
                    <p className="text-sm text-gray-600">Thông tin sẽ được bảo mật và chỉ sử dụng để giao hàng.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="input-label" htmlFor="customer_name">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="customer_name"
                        type="text"
                        autoComplete="name"
                        maxLength={80}
                        {...register('customer_name', { required: 'Vui lòng nhập họ và tên' })}
                        className={`input-field ${errors.customer_name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        placeholder="Nhập họ và tên đầy đủ"
                        aria-invalid={errors.customer_name ? 'true' : 'false'}
                      />
                      {errors.customer_name && (
                        <p className="text-red-500 text-sm mt-1">{errors.customer_name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="input-label" htmlFor="customer_phone">
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="customer_phone"
                        type="tel"
                        {...register('customer_phone', {
                          required: 'Vui lòng nhập số điện thoại',
                          pattern: {
                            value: /^[0-9]{10,11}$/,
                            message: 'Số điện thoại không hợp lệ'
                          }
                        })}
                        autoComplete="tel"
                        inputMode="tel"
                        maxLength={11}
                        className={`input-field ${errors.customer_phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        placeholder="Ví dụ: 0912345678"
                        aria-invalid={errors.customer_phone ? 'true' : 'false'}
                      />
                      {errors.customer_phone && (
                        <p className="text-red-500 text-sm mt-1">{errors.customer_phone.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="input-label" htmlFor="customer_email">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="customer_email"
                      type="email"
                      {...register('customer_email', {
                        required: 'Vui lòng nhập email',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Email không hợp lệ'
                        }
                      })}
                      autoComplete="email"
                      maxLength={120}
                      className={`input-field ${errors.customer_email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Nhập email nhận thông báo"
                      aria-invalid={errors.customer_email ? 'true' : 'false'}
                    />
                    {errors.customer_email && (
                      <p className="text-red-500 text-sm mt-1">{errors.customer_email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="input-label" htmlFor="shipping_address">
                      Địa chỉ giao hàng <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="shipping_address"
                      {...register('shipping_address', { required: 'Vui lòng nhập địa chỉ giao hàng' })}
                      autoComplete="street-address"
                      minLength={6}
                      className={`input-field min-h-[120px] ${errors.shipping_address ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                      rows={4}
                      placeholder="Nhập địa chỉ giao hàng chi tiết"
                      aria-invalid={errors.shipping_address ? 'true' : 'false'}
                    />
                    {errors.shipping_address && (
                      <p className="text-red-500 text-sm mt-1">{errors.shipping_address.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="input-label" htmlFor="notes">
                      Ghi chú cho đơn hàng <span className="text-gray-500 font-normal">(tùy chọn)</span>
                    </label>
                    <textarea
                      id="notes"
                      {...register('notes')}
                      className="input-field min-h-[100px]"
                      rows={3}
                      placeholder="Ghi chú thêm cho đơn hàng"
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 2: Shipping Method */}
              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 space-y-6"
                >
                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">Phương thức vận chuyển</h2>
                    <p className="text-sm text-gray-600">Chọn phương thức vận chuyển phù hợp với bạn.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="border-2 border-gray-200 rounded-lg p-5 hover:border-amber-500 transition-colors duration-300 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <input
                            type="radio"
                            id="standard"
                            value="standard"
                            {...register('shipping_method')}
                            defaultChecked
                            className="w-5 h-5 text-amber-600 focus:ring-amber-500 focus:ring-2"
                          />
                          <label htmlFor="standard" className="flex items-center space-x-4 cursor-pointer flex-1">
                            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                              <Truck className="w-6 h-6 text-amber-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">Giao hàng tiêu chuẩn</p>
                              <p className="text-sm text-gray-600 mt-1">Giao hàng trong 2-5 ngày làm việc</p>
                            </div>
                          </label>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">0₫</p>
                          <p className="text-sm text-emerald-600">Miễn phí</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Payment Method */}
              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 space-y-6"
                >
                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">Phương thức thanh toán</h2>
                    <p className="text-sm text-gray-600">Các giao dịch được mã hóa bằng chuẩn bảo mật SSL.</p>
                  </div>

                  <div className="space-y-4">
                    {/* Bank Transfer Option */}
                    <div className="border-2 border-gray-200 rounded-lg p-5 hover:border-amber-500 transition-colors duration-300 cursor-pointer">
                      <div className="flex items-center space-x-4">
                        <input
                          type="radio"
                          id="bank_transfer"
                          value="bank_transfer"
                          {...register('payment_method')}
                          defaultChecked
                          className="w-5 h-5 text-amber-600 focus:ring-amber-500 focus:ring-2"
                        />
                        <label htmlFor="bank_transfer" className="flex items-center space-x-4 cursor-pointer flex-1">
                          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-amber-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">Chuyển khoản qua ngân hàng</p>
                            <p className="text-sm text-gray-600 mt-1">Chuyển khoản trực tiếp vào tài khoản ngân hàng</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Bank Transfer Details */}
                    {paymentMethod === 'bank_transfer' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 p-6 bg-gray-50 rounded-lg border border-gray-200 space-y-4"
                      >
                        <div className="space-y-3">
                          <p className="text-sm text-gray-700 font-medium">
                            Cám ơn bạn đã đặt hàng tại RARE PARFUME
                          </p>
                          <p className="text-sm text-gray-700">
                            Bạn vui lòng chuyển khoản đến số tài khoản sau:
                          </p>
                          <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Ngân hàng:</span>
                              <span className="text-sm font-semibold text-gray-900">Techcombank</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Số tài khoản:</span>
                              <span className="text-sm font-semibold text-gray-900">6951696919</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Chủ tài khoản:</span>
                              <span className="text-sm font-semibold text-gray-900">Nguyễn Thế Sơn</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700">
                            Cám ơn bạn đã ủng hộ Rare Parfume.
                          </p>
                          <p className="text-xs text-gray-600 italic">
                            Nếu bạn cần thanh toán bằng thẻ Visa thì xin hãy INBOX shop.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* COD Option */}
                    <div className="border-2 border-gray-200 rounded-lg p-5 hover:border-amber-500 transition-colors duration-300 cursor-pointer">
                      <div className="flex items-center space-x-4">
                        <input
                          type="radio"
                          id="cod"
                          value="cod"
                          {...register('payment_method')}
                          className="w-5 h-5 text-amber-600 focus:ring-amber-500 focus:ring-2"
                        />
                        <label htmlFor="cod" className="flex items-center space-x-4 cursor-pointer flex-1">
                          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Package className="w-6 h-6 text-amber-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">Thanh toán khi giao hàng (COD)</p>
                            <p className="text-sm text-gray-600 mt-1">Thanh toán bằng tiền mặt khi nhận hàng</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="flex items-start space-x-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <Shield className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">Thanh toán an toàn</p>
                      <p className="text-xs text-emerald-700 mt-1">
                        Thông tin thanh toán của bạn được mã hóa và bảo mật
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Order Confirmation */}
              {currentStep === 4 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 space-y-6"
                >
                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">Xác nhận đơn hàng</h2>
                    <p className="text-sm text-gray-600">Vui lòng kiểm tra kỹ thông tin trước khi hoàn tất.</p>
                  </div>

                  {/* Order Summary */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 text-lg">Tóm tắt đơn hàng</h3>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
                          <div className="flex items-center space-x-4 flex-1 min-w-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                              loading="lazy"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{item.name}</p>
                              <p className="text-sm text-gray-600">{item.brand} • {item.volume_ml}ml</p>
                            </div>
                          </div>
                          <div className="text-right ml-4 flex-shrink-0">
                            <p className="font-semibold text-gray-900">{currencyFormatter.format(Number(item.price || 0))}</p>
                            <p className="text-sm text-gray-600">x{item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Tổng cộng</span>
                      <span className="text-xl font-bold text-amber-600">{currencyFormatter.format(Number(getTotalPrice() || 0))}</span>
                    </div>
                  </div>

                  {/* Customer Info */}
                  {orderData && (
                    <div className="p-5 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                      <h3 className="font-semibold text-gray-900">Thông tin giao hàng</h3>
                      <div className="space-y-2 text-sm text-gray-700">
                        <p><span className="font-medium">Tên:</span> {orderData.customer_name}</p>
                        <p><span className="font-medium">Email:</span> {orderData.customer_email}</p>
                        <p><span className="font-medium">SĐT:</span> {orderData.customer_phone}</p>
                        <p><span className="font-medium">Địa chỉ:</span> {orderData.shipping_address}</p>
                        <p><span className="font-medium">Phương thức vận chuyển:</span> Giao hàng tiêu chuẩn</p>
                        <p><span className="font-medium">Phương thức thanh toán:</span> {
                          orderData.payment_method === 'bank_transfer' ? 'Chuyển khoản qua ngân hàng' : 
                          orderData.payment_method === 'cod' ? 'Thanh toán khi giao hàng (COD)' : 
                          'QR Code'
                        }</p>
                        {orderData.notes && <p><span className="font-medium">Ghi chú:</span> {orderData.notes}</p>}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={goBack}
                  className="btn-secondary sm:w-auto w-full order-2 sm:order-1"
                >
                  Quay lại
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary sm:w-auto w-full order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Đang xử lý...' :
                   currentStep === 4 ? 'Hoàn tất đơn hàng' : 'Tiếp tục'}
                </button>
              </div>
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sticky top-24 space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-serif font-bold text-gray-900">Đơn hàng của bạn</h2>
                <p className="text-sm text-gray-600">{getTotalItems()} sản phẩm</p>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm line-clamp-2">{item.name}</p>
                      <p className="text-xs text-gray-600 mt-1">{item.brand}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-gray-900 text-sm">{currencyFormatter.format(Number(item.price || 0))}</p>
                      <p className="text-xs text-gray-600">x{item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex justify-between text-base text-gray-700">
                  <span>Tạm tính</span>
                  <span className="font-medium">{currencyFormatter.format(Number(getTotalPrice() || 0))}</span>
                </div>
                <div className="flex justify-between text-base text-gray-700">
                  <span>Phí vận chuyển</span>
                  <span className="text-emerald-600 font-medium">Miễn phí</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="text-lg font-bold text-gray-900">Tổng cộng</span>
                  <span className="text-xl font-bold text-amber-600">{currencyFormatter.format(Number(getTotalPrice() || 0))}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
