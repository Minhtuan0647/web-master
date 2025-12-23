import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  Users2,
  Loader2,
  Search,
  Mail,
  Phone,
  Calendar,
  Award,
  Sparkles,
  ShoppingBag,
  ClipboardList,
  Tag
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchAdminCustomers,
  fetchCustomerDetail,
  updateCustomerProfile
} from '../services/api';

const VIP_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'gold', label: 'Gold' },
  { value: 'platinum', label: 'Platinum' },
  { value: 'diamond', label: 'Diamond' }
];

const AdminCustomersPage = () => {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedEmail, setSelectedEmail] = useState(null);

  const listQueryParams = useMemo(
    () => ({
      search: searchTerm || undefined,
      page,
      limit: 12
    }),
    [page, searchTerm]
  );

  const {
    data: customersData,
    isLoading,
    isError,
    refetch
  } = useQuery(['admin-customers', listQueryParams], () => fetchAdminCustomers(listQueryParams), {
    keepPreviousData: true
  });

  const customers = useMemo(
    () => customersData?.customers || [],
    [customersData?.customers]
  );
  const summary = customersData?.summary || {};
  const pagination = customersData?.pagination || {};
  const totalPages = pagination.total_pages || 1;

  useEffect(() => {
    if (customers.length && !selectedEmail) {
      setSelectedEmail(customers[0].email);
    }
  }, [customers, selectedEmail]);

  const {
    data: customerDetail,
    isLoading: isLoadingDetail,
    refetch: refetchDetail
  } = useQuery(
    ['admin-customer-detail', selectedEmail],
    () => fetchCustomerDetail(selectedEmail),
    {
      enabled: Boolean(selectedEmail)
    }
  );

  const [profileForm, setProfileForm] = useState({
    note: '',
    tags: '',
    vip_status: 'standard',
    last_contacted_at: ''
  });

  useEffect(() => {
    if (customerDetail?.profile) {
      const { profile } = customerDetail;
      setProfileForm({
        note: profile.note || '',
        tags: Array.isArray(profile.tags) ? profile.tags.join(', ') : '',
        vip_status: profile.vip_status || 'standard',
        last_contacted_at: profile.last_contacted_at ? formatInputDate(profile.last_contacted_at) : ''
      });
    } else {
      setProfileForm({
        note: '',
        tags: '',
        vip_status: 'standard',
        last_contacted_at: ''
      });
    }
  }, [customerDetail]);

  const updateMutation = useMutation(
    (payload) => updateCustomerProfile(selectedEmail, payload),
    {
      onSuccess: () => {
        toast.success('Đã cập nhật hồ sơ khách hàng');
        queryClient.invalidateQueries('admin-customers');
        refetchDetail();
      },
      onError: () => {
        toast.error('Không thể cập nhật hồ sơ. Vui lòng thử lại.');
      }
    }
  );

  const handleSubmitProfile = (event) => {
    event.preventDefault();
    if (!selectedEmail) {
      return;
    }

    const tagsArray = profileForm.tags
      ? profileForm.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];

    updateMutation.mutate({
      note: profileForm.note || null,
      tags: tagsArray,
      vip_status: profileForm.vip_status,
      last_contacted_at: profileForm.last_contacted_at
        ? new Date(profileForm.last_contacted_at).toISOString()
        : null
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quản lý khách hàng</h1>
          <p className="text-slate-500">Theo dõi khách hàng trung thành và cập nhật ghi chú liên hệ.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSearchTerm('');
              setPage(1);
            }}
            className="inline-flex items-center space-x-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-100"
          >
            <ClipboardList className="w-4 h-4 text-slate-500" />
            <span>Đặt lại</span>
          </button>
          <button
            onClick={() => refetch()}
            className="btn-primary flex items-center space-x-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Tổng khách hàng" value={summary.total_customers || 0} icon={Users2} accent="bg-amber-100 text-amber-600" />
        <SummaryCard title="Khách quay lại" value={summary.repeat_customers || 0} icon={ShoppingBag} accent="bg-emerald-100 text-emerald-600" />
        <SummaryCard title="Khách hàng VIP" value={summary.vip_customers || 0} icon={Award} accent="bg-purple-100 text-purple-600" />
        <SummaryCard title="Cần follow-up" value={summary.pending_followups || 0} icon={ClipboardList} accent="bg-rose-100 text-rose-600" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Danh sách khách hàng</h2>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Tìm kiếm theo tên, email, số điện thoại"
                  className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>
            </div>

            {isError ? (
              <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-6 text-red-600">
                Không thể tải danh sách khách hàng. Vui lòng thử lại sau ít phút.
              </div>
            ) : isLoading ? (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : customers.length ? (
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                {customers.map((customer) => {
                  const isActive = selectedEmail === customer.email;
                  return (
                    <button
                      type="button"
                      key={customer.email}
                      onClick={() => setSelectedEmail(customer.email)}
                      className={`text-left rounded-2xl border p-5 transition-colors ${
                        isActive ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-slate-100 bg-white hover:border-amber-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{customer.name || customer.email}</p>
                          <p className="text-xs text-slate-500">{customer.email}</p>
                        </div>
                        {customer.vip_status !== 'standard' && (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                            {customer.vip_status?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-500">
                        <div>
                          <p className="text-xs uppercase tracking-wide">Số đơn</p>
                          <p className="font-semibold text-slate-900">{customer.total_orders}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide">Chi tiêu</p>
                          <p className="font-semibold text-slate-900">{formatCurrency(customer.total_spent)}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs uppercase tracking-wide">Lần mua gần nhất</p>
                          <p className="font-medium text-slate-900">{formatDate(customer.last_order_at)}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-slate-100 p-10 text-center text-slate-500">
                Chưa có dữ liệu khách hàng. Hãy khuyến khích khách đặt đơn đầu tiên.
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
                <span>
                  Trang {pagination.current_page} / {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page <= 1}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={page >= totalPages}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-xl font-semibold text-slate-900">Chi tiết khách hàng</h2>
            {isLoadingDetail ? (
              <div className="mt-6 space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : customerDetail?.customer ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="font-semibold text-slate-900">{customerDetail.customer.name || customerDetail.customer.email}</p>
                  <div className="mt-3 space-y-2 text-sm text-slate-500">
                    <InfoRow icon={Mail} label="Email" value={customerDetail.customer.email} />
                    {customerDetail.customer.phone && (
                      <InfoRow icon={Phone} label="Số điện thoại" value={customerDetail.customer.phone} />
                    )}
                    <InfoRow icon={Calendar} label="Lần mua gần nhất" value={formatDate(customerDetail.customer.last_order_at)} />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Nhật ký đơn hàng gần đây</h3>
                  <div className="mt-3 space-y-3">
                    {(customerDetail.orders || []).slice(0, 5).map((order) => (
                      <div key={order.id} className="rounded-xl border border-slate-100 px-4 py-3 text-sm text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">{order.order_number}</span>
                          <span className="text-xs text-slate-500">{formatDate(order.created_at)}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span>Trạng thái: <span className="font-medium text-slate-900">{order.status}</span></span>
                          <span className="font-semibold text-slate-900">{formatCurrency(order.total_amount)}</span>
                        </div>
                      </div>
                    ))}
                    {(customerDetail.orders || []).length === 0 && (
                      <p className="text-sm text-slate-500">Khách hàng chưa có đơn hàng nào.</p>
                    )}
                  </div>
                </div>

                <form onSubmit={handleSubmitProfile} className="space-y-4">
                  <div>
                    <label className="text-xs uppercase tracking-wide text-slate-500">Ghi chú</label>
                    <textarea
                      rows={3}
                      value={profileForm.note}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, note: event.target.value }))}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                      placeholder="Ví dụ: Khách thích hương gỗ, ưu tiên tư vấn bộ sưu tập giới hạn"
                    />
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-wide text-slate-500 flex items-center gap-2">
                      <Tag className="w-4 h-4" /> Thẻ ghi nhớ
                    </label>
                    <input
                      type="text"
                      value={profileForm.tags}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, tags: event.target.value }))}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                      placeholder="Ví dụ: loyal, ưu đãi sinh nhật"
                    />
                    <p className="mt-1 text-xs text-slate-400">Nhập các thẻ và phân tách bằng dấu phẩy.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs uppercase tracking-wide text-slate-500">Phân hạng khách hàng</label>
                      <select
                        value={profileForm.vip_status}
                        onChange={(event) => setProfileForm((prev) => ({ ...prev, vip_status: event.target.value }))}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                      >
                        {VIP_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wide text-slate-500">Ngày liên hệ gần nhất</label>
                      <input
                        type="datetime-local"
                        value={profileForm.last_contacted_at}
                        onChange={(event) => setProfileForm((prev) => ({ ...prev, last_contacted_at: event.target.value }))}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={updateMutation.isLoading}
                    className="btn-primary flex items-center justify-center gap-2"
                  >
                    {updateMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Lưu hồ sơ khách hàng</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-slate-100 p-10 text-center text-slate-500">
                Hãy chọn một khách hàng để xem chi tiết.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, icon: Icon, accent }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      </div>
      <div className={`rounded-xl p-3 ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </div>
);

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3">
    <Icon className="w-4 h-4 text-slate-400" />
    <div className="flex-1">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-900">{value || '—'}</p>
    </div>
  </div>
);

const formatCurrency = (value) => {
  const formatter = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  });
  return formatter.format(Number(value || 0));
};

const formatDate = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatInputDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const pad = (num) => num.toString().padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

export default AdminCustomersPage;
