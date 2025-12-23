import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  MessageCircle,
  Loader2,
  Search,
  Inbox,
  CheckCircle2,
  Archive,
  Clock,
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchAdminFeedbacks,
  updateFeedback
} from '../services/api';

const STATUS_TABS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'new', label: 'Mới' },
  { value: 'in_progress', label: 'Đang xử lý' },
  { value: 'resolved', label: 'Đã xử lý' },
  { value: 'archived', label: 'Lưu trữ' }
];

const statusBadges = {
  new: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-slate-100 text-slate-600'
};

const AdminFeedbackPage = () => {
  const outletContext = useOutletContext() || {};
  const { dashboardData } = outletContext;
  const userRole = dashboardData?.user?.role;
  const canManage = userRole === 'admin';

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [notesDraft, setNotesDraft] = useState({});

  const queryClient = useQueryClient();

  const queryParams = useMemo(
    () => ({
      status: statusFilter,
      search: searchTerm || undefined,
      page,
      limit: 10
    }),
    [page, searchTerm, statusFilter]
  );

  const {
    data: feedbackData,
    isLoading,
    isError,
    refetch,
    isFetching
  } = useQuery(['admin-feedbacks', queryParams], () => fetchAdminFeedbacks(queryParams), {
    keepPreviousData: true
  });

  const feedbacks = feedbackData?.feedbacks || [];
  const summary = feedbackData?.summary || {};
  const pagination = feedbackData?.pagination || {};
  const totalPages = pagination.total_pages || 1;

  const updateMutation = useMutation(
    ({ id, payload }) => updateFeedback(id, payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-feedbacks');
        toast.success('Đã cập nhật feedback');
      },
      onError: () => {
        toast.error('Không thể cập nhật feedback. Vui lòng thử lại.');
      }
    }
  );

  const handleChangeStatus = (feedback, status) => {
    if (!canManage) {
      return;
    }

    if (feedback.status === status) {
      toast.success('Feedback đã ở trạng thái này');
      return;
    }

    updateMutation.mutate({ id: feedback.id, payload: { status } });
  };

  const handleSaveNote = (feedback) => {
    if (!canManage) {
      return;
    }

    const note = notesDraft[feedback.id];
    if (note === feedback.admin_notes) {
      toast('Không có thay đổi để lưu');
      return;
    }

    updateMutation.mutate({ id: feedback.id, payload: { admin_notes: note } });
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setSearchTerm('');
    setPage(1);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quản lý phản hồi khách hàng</h1>
          <p className="text-slate-500">
            Theo dõi phản hồi, cập nhật ghi chú và phối hợp xử lý với đội ngũ chăm sóc khách hàng.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={resetFilters}
            className="inline-flex items-center space-x-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-100"
          >
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Đặt lại</span>
          </button>
          <button
            onClick={() => refetch()}
            className="btn-primary flex items-center space-x-2"
          >
            <RotateCcwIcon isLoading={isFetching || updateMutation.isLoading} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Tổng phản hồi" value={summary.total || 0} description="Tất cả phản hồi trong hệ thống" />
        <SummaryCard title="Mới" value={summary.new || 0} accent="text-amber-600" description="Chưa xử lý" />
        <SummaryCard title="Đang xử lý" value={summary.in_progress || 0} accent="text-sky-600" description="Cần theo dõi" />
        <SummaryCard title="Đã xử lý" value={summary.resolved || 0} accent="text-emerald-600" description="Hoàn thành" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setPage(1);
                }}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  statusFilter === tab.value
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Tìm theo tên khách hàng, email hoặc nội dung"
              className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
          </div>
        </div>

        {isError ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-600">
            <p className="font-semibold">Không thể tải danh sách feedback. Vui lòng thử lại.</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : feedbacks.length ? (
          <div className="space-y-4">
            {feedbacks.map((feedback) => {
              const badgeClass = statusBadges[feedback.status] || 'bg-slate-100 text-slate-600';
              const noteDraft = notesDraft[feedback.id] ?? feedback.admin_notes ?? '';

              return (
                <div key={feedback.id} className="rounded-2xl border border-slate-100 p-5 shadow-sm hover:border-amber-200 transition-colors">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-amber-50 p-3 text-amber-600">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">{feedback.customer_name || 'Khách hàng'}</p>
                          {feedback.customer_email && (
                            <span className="text-xs text-slate-500">{feedback.customer_email}</span>
                          )}
                        </div>
                        {feedback.customer_phone && (
                          <p className="text-xs text-slate-400">SĐT: {feedback.customer_phone}</p>
                        )}
                        <p className="mt-3 text-sm text-slate-600 leading-relaxed">{feedback.message}</p>
                        {feedback.rating ? (
                          <p className="mt-2 text-xs font-medium text-amber-600">Đánh giá: {feedback.rating}/5</p>
                        ) : null}
                      </div>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${badgeClass}`}>
                      {STATUS_TABS.find((tab) => tab.value === feedback.status)?.label || feedback.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div>
                      <label className="text-xs uppercase tracking-wide text-slate-500">Ghi chú nội bộ</label>
                      <textarea
                        rows={3}
                        value={noteDraft}
                        onChange={(event) =>
                          setNotesDraft((prev) => ({ ...prev, [feedback.id]: event.target.value }))
                        }
                        disabled={!canManage}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50"
                        placeholder="Thêm ghi chú để đội ngũ dễ dàng theo dõi"
                      />
                      {canManage && (
                        <button
                          onClick={() => handleSaveNote(feedback)}
                          className="mt-2 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium hover:bg-slate-100"
                          disabled={updateMutation.isLoading}
                        >
                          {updateMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                          <span>Lưu ghi chú</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-slate-500">
                      <div className="flex items-center justify-between">
                        <span>Ngày tạo</span>
                        <span className="font-medium text-slate-900">{formatDate(feedback.created_at)}</span>
                      </div>
                      {feedback.follow_up_date && (
                        <div className="flex items-center justify-between">
                          <span>Ngày follow-up</span>
                          <span className="font-medium text-slate-900">{formatDate(feedback.follow_up_date)}</span>
                        </div>
                      )}
                      {canManage && (
                        <div className="flex flex-wrap items-center gap-2 pt-3">
                          <button
                            onClick={() => handleChangeStatus(feedback, 'in_progress')}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs hover:bg-slate-100"
                            disabled={updateMutation.isLoading}
                          >
                            <Clock className="w-4 h-4" />
                            <span>Đang xử lý</span>
                          </button>
                          <button
                            onClick={() => handleChangeStatus(feedback, 'resolved')}
                            className="inline-flex items-center gap-1 rounded-full border border-emerald-200 px-3 py-1 text-xs text-emerald-600 hover:bg-emerald-50"
                            disabled={updateMutation.isLoading}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Hoàn thành</span>
                          </button>
                          <button
                            onClick={() => handleChangeStatus(feedback, 'archived')}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:bg-slate-100"
                            disabled={updateMutation.isLoading}
                          >
                            <Archive className="w-4 h-4" />
                            <span>Lưu trữ</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 text-sm text-slate-500">
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
        ) : (
          <div className="rounded-2xl border border-slate-100 p-10 text-center text-slate-500">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Inbox className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-700">Không có feedback nào</h3>
            <p className="mt-2 text-sm">Hãy khuyến khích khách hàng để lại phản hồi để đội ngũ cải thiện dịch vụ.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, description, accent = 'text-slate-600' }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
    <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
    <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    <p className={`mt-2 text-sm ${accent}`}>{description}</p>
  </div>
);

const formatDate = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit'
  });
};

const RotateCcwIcon = ({ isLoading }) => (
  isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />
);

export default AdminFeedbackPage;
