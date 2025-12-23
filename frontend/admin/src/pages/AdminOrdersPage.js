import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Search,
  Eye,
  Package,
  X,
  Plus,
  Loader2,
  AlertCircle,
  Inbox,
  RotateCcw
} from 'lucide-react';
import { fetchAdminOrders, updateOrderStatus } from '../services/api';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'shipped', label: 'Đang giao hàng' },
  { value: 'delivered', label: 'Đã giao hàng' },
  { value: 'cancelled', label: 'Đã hủy', adminOnly: true }
];

const STATUS_BADGES = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700'
};

const STATUS_LABELS = {
  pending: 'Chờ xử lý',
  paid: 'Đã thanh toán',
  shipped: 'Đang giao hàng',
  delivered: 'Đã giao hàng',
  cancelled: 'Đã hủy'
};

const ROLE_LABELS = {
  admin: 'Quản trị viên',
  sale: 'Nhân viên bán hàng'
};

const AdminOrdersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const queryClient = useQueryClient();

  const {
    data: ordersData,
    isLoading,
    isError,
    refetch
  } = useQuery(['admin-orders', currentPage, searchTerm, statusFilter], () => fetchAdminOrders({
    page: currentPage,
    limit: 10,
    search: searchTerm,
    status: statusFilter === 'all' ? '' : statusFilter
  }), {
    keepPreviousData: true
  });

  const isAdmin = ordersData?.user?.role === 'admin';
  const userRoleLabel = ROLE_LABELS[ordersData?.user?.role] || 'Người dùng';
  const orders = ordersData?.orders || [];
  const pagination = ordersData?.pagination || {};
  const pageSize = pagination.limit || 10;
  const totalCount = pagination.total_count || 0;
  const fromItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toItem = Math.min(currentPage * pageSize, totalCount);

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }),
    []
  );

  const dateTimeFormatter = useMemo(
    () => new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    []
  );

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

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const emptyStateTitle = searchTerm || statusFilter !== 'all'
    ? 'Không tìm thấy đơn hàng phù hợp'
    : 'Chưa có đơn hàng';
  const emptyStateDescription = searchTerm || statusFilter !== 'all'
    ? 'Hãy thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc trạng thái.'
    : 'Đơn hàng mới sẽ xuất hiện tại đây ngay khi được tạo.';

  if (isError) {
    return (
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 text-center text-red-600">
        <div className="flex flex-col items-center space-y-3">
          <AlertCircle className="w-10 h-10" />
          <p className="text-lg font-semibold">Không thể tải danh sách đơn hàng</p>
          <p className="text-sm text-red-500">Vui lòng kiểm tra kết nối và thử lại.</p>
          <button onClick={() => refetch()} className="btn-primary px-5">Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Quản lý đơn hàng</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            Vai trò: <span className="font-semibold text-slate-700">{userRoleLabel}</span>. Xem và cập nhật trạng thái đơn hàng.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Làm mới</span>
          </button>
          {ordersData?.user?.role === 'sale' && (
            <button className="btn-primary flex items-center justify-center space-x-2 text-sm">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Tạo đơn hàng</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Tìm kiếm theo mã đơn hàng, khách hàng hoặc email..."
              className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0">
            {STATUS_OPTIONS.filter((option) => isAdmin || !option.adminOnly).map((option) => (
              <button
                key={option.value || 'all'}
                onClick={() => handleStatusFilterChange(option.value)}
                className={`px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border transition-colors whitespace-nowrap flex-shrink-0 ${
                  statusFilter === option.value
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        {(searchTerm || statusFilter !== 'all') && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-xs sm:text-sm text-slate-500">
            <div className="flex flex-wrap items-center gap-2">
              <span>Đang lọc theo:</span>
              {searchTerm && (
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs">
                  Từ khóa: {searchTerm}
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs">
                  Trạng thái: {STATUS_LABELS[statusFilter]}
                </span>
              )}
            </div>
            <button onClick={resetFilters} className="text-amber-600 hover:text-amber-700 text-xs sm:text-sm self-start sm:self-auto">
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm">
        {isLoading ? (
          <OrdersTableSkeleton />
        ) : orders.length ? (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-full inline-block align-middle">
              {/* Desktop Table View */}
              <table className="hidden md:table w-full">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="py-4 px-6">Mã đơn hàng</th>
                    <th className="py-4 px-6">Khách hàng</th>
                    <th className="py-4 px-6">Tổng tiền</th>
                    <th className="py-4 px-6">Trạng thái</th>
                    <th className="py-4 px-6">Ngày tạo</th>
                    <th className="py-4 px-6">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-semibold text-slate-900">{order.order_number}</p>
                        <p className="text-xs text-slate-500">{order.payment_method}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-medium text-slate-900">{order.customer_name}</p>
                        <p className="text-xs text-slate-500">{order.customer_email}</p>
                        <p className="text-xs text-slate-500">{order.customer_phone}</p>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {currencyFormatter.format(Number(order.total_amount || 0))}
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-500">
                        {dateTimeFormatter.format(new Date(order.created_at))}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                            className="text-xs border border-slate-200 rounded px-2 py-1 focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                            disabled={updateStatusMutation.isLoading}
                          >
                            {STATUS_OPTIONS.filter((option) => option.value !== 'all' && (!option.adminOnly || isAdmin)).map((option) => (
                              <option key={option.value} value={option.value}>
                                {STATUS_LABELS[option.value]}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3 p-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{order.order_number}</p>
                        <p className="text-xs text-slate-500 mt-1">{order.payment_method}</p>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <StatusBadge status={order.status} />
                      </div>
                    </div>
                    <div className="space-y-2 text-sm mb-3">
                      <div>
                        <span className="text-slate-500">Khách hàng: </span>
                        <span className="font-medium text-slate-900">{order.customer_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Email: </span>
                        <span className="text-slate-700 truncate block">{order.customer_email}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">SĐT: </span>
                        <span className="text-slate-700">{order.customer_phone}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-200">
                        <span className="text-slate-500">Tổng tiền:</span>
                        <span className="font-semibold text-slate-900">{currencyFormatter.format(Number(order.total_amount || 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ngày tạo:</span>
                        <span className="text-slate-600 text-xs">{dateTimeFormatter.format(new Date(order.created_at))}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Chi tiết</span>
                      </button>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-amber-500 focus:border-transparent bg-white"
                        disabled={updateStatusMutation.isLoading}
                      >
                        {STATUS_OPTIONS.filter((option) => option.value !== 'all' && (!option.adminOnly || isAdmin)).map((option) => (
                          <option key={option.value} value={option.value}>
                            {STATUS_LABELS[option.value]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState icon={Inbox} title={emptyStateTitle} description={emptyStateDescription} />
        )}

        {orders.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 px-4 sm:px-6 py-4 border-t border-slate-100">
            <div className="text-xs sm:text-sm text-slate-500 text-center sm:text-left">
              Hiển thị {fromItem}-{toItem} trên tổng số {totalCount} đơn hàng
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
              >
                Trước
              </button>
              <span className="text-sm text-slate-600">
                Trang {currentPage} / {pagination.total_pages || 1}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.total_pages || 1))}
                disabled={currentPage === (pagination.total_pages || 1)}
                className="px-3 py-2 border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleStatusUpdate}
          isAdmin={isAdmin}
          isUpdating={updateStatusMutation.isLoading}
          formatCurrency={(value) => currencyFormatter.format(Number(value || 0))}
          formatDateTime={(value) => dateTimeFormatter.format(new Date(value))}
        />
      )}
    </div>
  );
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
    STATUS_BADGES[status] || 'bg-slate-100 text-slate-700'
  }`}>
    {STATUS_LABELS[status] || status}
  </span>
);

const OrdersTableSkeleton = () => (
  <div className="space-y-3 p-6">
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
    ))}
  </div>
);

const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 text-slate-500">
    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
      <Icon className="w-7 h-7 text-slate-400" />
    </div>
    <p className="text-lg font-semibold text-slate-700">{title}</p>
    <p className="text-sm text-slate-500 max-w-md">{description}</p>
  </div>
);

const OrderDetailModal = ({ order, onClose, onStatusUpdate, isAdmin, isUpdating, formatCurrency, formatDateTime }) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-slate-900/50" onClick={onClose} aria-hidden="true" />
        <div className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Chi tiết đơn hàng #{order.order_number}</h2>
              <p className="text-sm text-slate-500">Tạo lúc {formatDateTime(order.created_at)}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg" aria-label="Đóng">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                <h3 className="font-semibold text-slate-900">Thông tin đơn hàng</h3>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã đơn hàng:</span>
                  <span className="font-medium text-slate-900">{order.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tổng tiền:</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(order.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Thanh toán:</span>
                  <span className="font-medium text-slate-900">{order.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Trạng thái:</span>
                  <StatusBadge status={order.status} />
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                <h3 className="font-semibold text-slate-900">Thông tin khách hàng</h3>
                <p><span className="text-slate-500">Tên:</span> <span className="font-medium text-slate-900 ml-2">{order.customer_name}</span></p>
                <p><span className="text-slate-500">Email:</span> <span className="font-medium text-slate-900 ml-2">{order.customer_email}</span></p>
                <p><span className="text-slate-500">SĐT:</span> <span className="font-medium text-slate-900 ml-2">{order.customer_phone}</span></p>
                <p><span className="text-slate-500">Địa chỉ:</span> <span className="font-medium text-slate-900 ml-2">{order.shipping_address}</span></p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Sản phẩm trong đơn</h3>
              <div className="space-y-3">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-b-0">
                    <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                      {item.product_image ? (
                        <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{item.product_name}</p>
                      <p className="text-sm text-slate-500">Số lượng: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900">{formatCurrency(item.price_at_purchase)}</p>
                      <p className="text-xs text-slate-500">Tổng: {formatCurrency(item.price_at_purchase * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {order.notes && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Ghi chú</h3>
                <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4">{order.notes}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-700">Cập nhật trạng thái</span>
              <select
                value={order.status}
                onChange={(e) => onStatusUpdate(order.id, e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                disabled={isUpdating}
              >
                {STATUS_OPTIONS.filter((option) => option.value !== 'all' && (!option.adminOnly || isAdmin)).map((option) => (
                  <option key={option.value} value={option.value}>
                    {STATUS_LABELS[option.value]}
                  </option>
                ))}
              </select>
              {isUpdating && <Loader2 className="w-4 h-4 animate-spin text-amber-600" />}
            </div>
            <button onClick={onClose} className="btn-secondary">
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrdersPage;
