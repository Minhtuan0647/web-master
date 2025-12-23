import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  Package,
  X,
  Plus
} from 'lucide-react';
import {
  fetchAdminOrders,
  updateOrderStatus,
  fetchAdminProducts
} from '../../services/api';
import toast from 'react-hot-toast';

const AdminOrdersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);

  const queryClient = useQueryClient();

  const { data: ordersData, isLoading } = useQuery(
    ['admin-orders', currentPage, searchTerm, statusFilter],
    () => fetchAdminOrders({
      page: currentPage,
      limit: 10,
      search: searchTerm,
      status: statusFilter
    }),
    {
      keepPreviousData: true,
    }
  );

  // Check if user is admin (can delete orders)
  const isAdmin = ordersData?.user?.role === 'admin';

  const orders = ordersData?.orders || [];
  const pagination = ordersData?.pagination || {};

  const updateStatusMutation = useMutation(
    ({ id, status }) => updateOrderStatus(id, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-orders');
        toast.success('Trạng thái đơn hàng đã được cập nhật!');
        setSelectedOrder(null);
      },
      onError: () => {
        toast.error('Có lỗi xảy ra khi cập nhật trạng thái');
      }
    }
  );

  const handleStatusUpdate = (orderId, newStatus) => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'shipped':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <Package className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'paid':
        return 'text-blue-600 bg-blue-100';
      case 'shipped':
        return 'text-purple-600 bg-purple-100';
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Quản lý đơn hàng
          {ordersData?.user?.role === 'admin' && (
            <span className="ml-2 text-lg font-normal text-gray-600">- Quản trị viên</span>
          )}
          {ordersData?.user?.role === 'sales' && (
            <span className="ml-2 text-lg font-normal text-blue-600">- Nhân viên bán hàng</span>
          )}
        </h1>
        <p className="text-gray-600">
          {ordersData?.user?.role === 'admin'
            ? 'Xem và cập nhật trạng thái đơn hàng - Toàn quyền quản lý'
            : 'Xem và cập nhật trạng thái đơn hàng do bạn tạo'
          }
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 flex-1">
            <div className="flex-1 relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm theo mã đơn hàng hoặc tên khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="pending">Chờ xử lý</option>
                <option value="paid">Đã thanh toán</option>
                <option value="shipped">Đang giao hàng</option>
                <option value="delivered">Đã giao hàng</option>
                {isAdmin && <option value="cancelled">Đã hủy</option>}
              </select>
            </div>
          </div>

          {/* Create Order Button - Only for Sales */}
          {ordersData?.user?.role === 'sales' && (
            <button
              onClick={() => setShowCreateOrderModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Tạo đơn hàng</span>
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Mã đơn hàng</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Khách hàng</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Tổng tiền</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Trạng thái</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Ngày tạo</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{order.order_number}</div>
                      <div className="text-sm text-gray-600">
                        {order.payment_method === 'bank_transfer' ? 'Chuyển khoản' :
                         order.payment_method === 'cod' ? 'COD' :
                         order.payment_method === 'qr_code' ? 'QR Code' :
                         order.payment_method || 'N/A'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{order.customer_name}</div>
                      <div className="text-sm text-gray-600">{order.customer_email}</div>
                      <div className="text-sm text-gray-600">{order.customer_phone}</div>
                    </td>
                    <td className="py-4 px-6 font-medium text-gray-900">
                      ${order.total_amount}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span>{getStatusText(order.status)}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                        >
                          <option value="pending">Chờ xử lý</option>
                          <option value="paid">Đã thanh toán</option>
                          <option value="shipped">Đang giao hàng</option>
                          <option value="delivered">Đã giao hàng</option>
                          {isAdmin && <option value="cancelled">Đã hủy</option>}
                        </select>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              if (window.confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) {
                                // Add delete functionality here
                                toast.info('Chức năng xóa đang được phát triển');
                              }
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            title="Xóa đơn hàng"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Hiển thị {orders.length} trong tổng số {pagination.total_count} đơn hàng
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Trước
              </button>
              <span className="px-3 py-2 text-gray-600">
                {currentPage} / {pagination.total_pages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.total_pages))}
                disabled={currentPage === pagination.total_pages}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      {/* Create Order Modal */}
      {showCreateOrderModal && (
        <CreateOrderModal
          onClose={() => setShowCreateOrderModal(false)}
        />
      )}
    </div>
  );
};

const OrderDetailModal = ({ order, onClose, onStatusUpdate }) => {
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-600 opacity-75" onClick={onClose}></div>
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Chi tiết đơn hàng #{order.order_number}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
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
                    <span className="font-medium text-lg">${order.total_amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phương thức thanh toán:</span>
                    <span className="font-medium">
                      {order.payment_method === 'bank_transfer' ? 'Chuyển khoản' :
                       order.payment_method === 'cod' ? 'COD' :
                       order.payment_method === 'qr_code' ? 'QR Code' :
                       order.payment_method || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phương thức vận chuyển:</span>
                    <span className="font-medium">
                      {order.shipping_method === 'standard' ? 'Giao hàng tiêu chuẩn' :
                       order.shipping_method || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Thông tin khách hàng</h3>
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

            {/* Order Items */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Sản phẩm đã đặt</h3>
              <div className="space-y-3">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 py-3 border-b border-gray-200 last:border-b-0">
                    <img
                      src={item.product_image || '/images/placeholder.jpg'}
                      alt={item.product_name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                      <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">${item.price_at_purchase}</p>
                      <p className="text-sm text-gray-600">
                        Tổng: ${(item.price_at_purchase * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Ghi chú</h3>
                <p className="text-gray-600 bg-gray-50 rounded-lg p-3">{order.notes}</p>
              </div>
            )}

            {/* Status Update */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Cập nhật trạng thái</h3>
                <select
                  value={order.status}
                  onChange={(e) => onStatusUpdate(order.id, e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="pending">Chờ xử lý</option>
                  <option value="paid">Đã thanh toán</option>
                  <option value="shipped">Đang giao hàng</option>
                  <option value="delivered">Đã giao hàng</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>
              <button
                onClick={onClose}
                className="btn-secondary"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CreateOrderModal = ({ onClose }) => {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [orderNotes, setOrderNotes] = useState('');

  const { data: productsData, isLoading: productsLoading } = useQuery(
    'admin-products',
    () => fetchAdminProducts({ limit: 100 })
  );

  const products = productsData?.products || [];

  const handleAddProduct = (product) => {
    const existingProduct = selectedProducts.find(p => p.id === product.id);

    if (existingProduct) {
      setSelectedProducts(prev =>
        prev.map(p =>
          p.id === product.id
            ? { ...p, quantity: p.quantity + 1 }
            : p
        )
      );
    } else {
      setSelectedProducts(prev => [...prev, { ...product, quantity: 1 }]);
    }
  };

  const handleUpdateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      setSelectedProducts(prev => prev.filter(p => p.id !== productId));
    } else {
      setSelectedProducts(prev =>
        prev.map(p =>
          p.id === productId ? { ...p, quantity } : p
        )
      );
    }
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((total, product) => {
      return total + (product.price * product.quantity);
    }, 0);
  };

  const handleSubmit = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Vui lòng chọn ít nhất một sản phẩm');
      return;
    }

    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      toast.error('Vui lòng điền đầy đủ thông tin khách hàng');
      return;
    }

    // Here you would typically send the order data to the API
    toast.success('Đơn hàng đã được tạo thành công!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-600 opacity-75" onClick={onClose}></div>
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Tạo đơn hàng mới</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Customer Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Thông tin khách hàng</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên khách hàng *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Nhập tên khách hàng"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Nhập email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ giao hàng *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Nhập địa chỉ giao hàng"
                  />
                </div>
              </div>
            </div>

            {/* Products Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Sản phẩm</h3>
                <button
                  onClick={() => setShowProductSelector(true)}
                  className="btn-primary text-sm"
                >
                  Thêm sản phẩm
                </button>
              </div>

              {/* Selected Products */}
              {selectedProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  Chưa có sản phẩm nào được chọn
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedProducts.map((product) => (
                    <div key={product.id} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                      <img
                        src={product.image_urls?.[0] || '/images/placeholder.jpg'}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        <p className="text-sm text-gray-600">${product.price}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleUpdateQuantity(product.id, product.quantity - 1)}
                          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{product.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(product.id, product.quantity + 1)}
                          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right min-w-0">
                        <p className="font-medium text-gray-900">
                          ${(product.price * product.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Summary */}
            {selectedProducts.length > 0 && (
              <div className="bg-amber-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">Tổng cộng:</span>
                  <span className="text-xl font-bold text-amber-600">
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú đơn hàng
              </label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                rows={3}
                placeholder="Ghi chú đặc biệt cho đơn hàng..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="btn-secondary"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                className="btn-primary"
              >
                Tạo đơn hàng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Selection Modal */}
      {showProductSelector && (
        <ProductSelectionModal
          products={products}
          onClose={() => setShowProductSelector(false)}
          onSelectProduct={handleAddProduct}
          isLoading={productsLoading}
        />
      )}
    </div>
  );
};

const ProductSelectionModal = ({ products, onClose, onSelectProduct, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-600 opacity-75" onClick={onClose}></div>
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Chọn sản phẩm</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {/* Search */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="loading-spinner"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <img
                      src={product.image_urls?.[0] || '/images/placeholder.jpg'}
                      alt={product.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                    <h3 className="font-medium text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
                    <p className="text-lg font-bold text-amber-600">${product.price}</p>
                    <button
                      onClick={() => {
                        onSelectProduct(product);
                        onClose();
                      }}
                      className="w-full mt-3 btn-primary text-sm"
                    >
                      Thêm vào đơn hàng
                    </button>
                  </div>
                ))}
              </div>
            )}

            {filteredProducts.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500">
                Không tìm thấy sản phẩm nào
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrdersPage;
