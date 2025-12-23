import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  BookOpen,
  Loader2,
  Search,
  Plus,
  Edit3,
  Trash2,
  Sparkles,
  Calendar,
  Upload,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchAdminBlogs,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost
} from '../services/api';

const STATUS_FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'published', label: 'Đã xuất bản' },
  { value: 'draft', label: 'Bản nháp' }
];

const defaultForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  author: '',
  featured_image: '',
  is_published: false
};

const AdminBlogsPage = () => {
  const outletContext = useOutletContext() || {};
  const { dashboardData } = outletContext;
  const userRole = dashboardData?.user?.role;
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState(defaultForm);
  const [editingPost, setEditingPost] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (userRole !== 'admin') {
      toast.error('Bạn không có quyền truy cập trang này');
    }
  }, [userRole]);

  const listParams = useMemo(
    () => ({
      status: statusFilter,
      search: searchTerm || undefined,
      page,
      limit: 10
    }),
    [page, searchTerm, statusFilter]
  );

  const {
    data: blogData,
    isLoading,
    isError,
    refetch
  } = useQuery(['admin-blogs', listParams], () => fetchAdminBlogs(listParams), {
    keepPreviousData: true,
    enabled: userRole === 'admin',
    staleTime: 0, // Always consider data stale
    cacheTime: 0, // Don't cache
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: true // Refetch when window gains focus
  });

  const blogs = useMemo(() => blogData?.blogs || [], [blogData?.blogs]);
  const summary = useMemo(() => blogData?.summary || {}, [blogData?.summary]);
  const pagination = useMemo(() => blogData?.pagination || {}, [blogData?.pagination]);
  const totalPages = pagination.total_pages || 1;

  // Debug logging
  useEffect(() => {
    if (blogData) {
      console.log('[AdminBlogsPage] Blog data received:', {
        blogsCount: blogs.length,
        blogs: blogs,
        blogsWithIds: blogs.filter(b => b && b.id).length,
        summary: summary,
        pagination: pagination,
        isLoading: isLoading,
        isError: isError,
        rawBlogData: blogData
      });
      
      if (blogs.length === 0 && summary.total > 0) {
        console.warn('[AdminBlogsPage] WARNING: Summary shows blogs but blogs array is empty!', {
          summaryTotal: summary.total,
          summaryPublished: summary.published,
          summaryDrafts: summary.drafts,
          statusFilter: statusFilter,
          page: page,
          rawBlogs: blogData.blogs
        });
      }
    }
  }, [blogData, blogs, summary, pagination, isLoading, isError, statusFilter, page]);

  const createMutation = useMutation(createBlogPost, {
    onSuccess: () => {
      toast.success('Đã tạo bài viết');
      queryClient.invalidateQueries('admin-blogs');
      queryClient.invalidateQueries('recent-blogs');
      queryClient.invalidateQueries('blog-posts');
      setFormData(defaultForm);
      setEditingPost(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error) => {
      console.error('Error creating blog post:', error);
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          (error?.response?.data?.errors && error.response.data.errors[0]?.msg) ||
                          error?.message || 
                          'Không thể tạo bài viết. Vui lòng thử lại.';
      toast.error(errorMessage);
    }
  });

  const updateMutation = useMutation(({ id, payload }) => updateBlogPost(id, payload), {
    onSuccess: () => {
      toast.success('Đã cập nhật bài viết');
      queryClient.invalidateQueries('admin-blogs');
      queryClient.invalidateQueries('recent-blogs');
      queryClient.invalidateQueries('blog-posts');
    },
    onError: (error) => {
      console.error('Error updating blog post:', error);
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          error?.message || 
                          'Không thể cập nhật bài viết. Vui lòng thử lại.';
      toast.error(errorMessage);
    }
  });

  const deleteMutation = useMutation(deleteBlogPost, {
    onSuccess: () => {
      toast.success('Đã xóa bài viết');
      queryClient.invalidateQueries('admin-blogs');
      queryClient.invalidateQueries('recent-blogs');
      queryClient.invalidateQueries('blog-posts');
      if (editingPost) {
        setFormData(defaultForm);
        setEditingPost(null);
      }
    },
    onError: (error) => {
      console.error('Error deleting blog post:', error);
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          error?.message || 
                          'Không thể xóa bài viết. Vui lòng thử lại.';
      toast.error(errorMessage);
    }
  });

  const handleSelectPost = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      author: post.author || '',
      featured_image: post.featured_image || '',
      is_published: Boolean(post.is_published)
    });
    setImagePreview(post.featured_image || null);
  };

  const handleResetForm = () => {
    setEditingPost(null);
    setFormData(defaultForm);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh hợp lệ');
      return;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File vượt quá 5MB. Vui lòng chọn file nhỏ hơn.');
      return;
    }

    setIsUploading(true);

    // Convert file to base64 data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      // Check if base64 string is too large (approximately 7MB base64 = ~5MB file)
      if (dataUrl.length > 7 * 1024 * 1024) {
        toast.error('File quá lớn sau khi chuyển đổi');
        setIsUploading(false);
        return;
      }
      setImagePreview(dataUrl);
      setFormData((prev) => ({ ...prev, featured_image: dataUrl }));
      setIsUploading(false);
      toast.success('Đã tải ảnh lên thành công');
    };
    reader.onerror = () => {
      toast.error('Có lỗi xảy ra khi đọc file hình ảnh');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, featured_image: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Đã xóa ảnh');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formData.title || !formData.content) {
      toast.error('Vui lòng nhập tiêu đề và nội dung bài viết');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      is_published: Boolean(formData.is_published)
    };

    // Add optional fields only if they have values
    if (formData.slug?.trim()) {
      payload.slug = formData.slug.trim();
    }
    if (formData.excerpt?.trim()) {
      payload.excerpt = formData.excerpt.trim();
    }
    if (formData.author?.trim()) {
      payload.author = formData.author.trim();
    }
    if (formData.featured_image?.trim()) {
      payload.featured_image = formData.featured_image.trim();
    }

    console.log('Submitting blog post:', { editingPost: editingPost?.id, payload });

    try {
      if (editingPost) {
        updateMutation.mutate({ id: editingPost.id, payload });
      } else {
        createMutation.mutate(payload);
      }
    } catch (error) {
      console.error('Error submitting blog post:', error);
      toast.error('Có lỗi xảy ra khi gửi bài viết. Vui lòng thử lại.');
    }
  };

  const handleDelete = (post) => {
    if (!post || !post.id) {
      toast.error('Không thể xóa bài viết: ID không hợp lệ');
      console.error('Invalid post data:', post);
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài viết "${post.title}"?`)) {
      return;
    }

    deleteMutation.mutate(post.id);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quản lý bài viết</h1>
          <p className="text-slate-500">Xây dựng nội dung truyền thông và cập nhật thông tin mới nhất.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetForm}
            className="inline-flex items-center space-x-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-100"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Tạo mới</span>
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
        <SummaryCard title="Tổng bài viết" value={summary.total || 0} description="Tất cả bài viết" />
        <SummaryCard title="Đang xuất bản" value={summary.published || 0} description="Hiển thị trên website" accent="text-emerald-600" />
        <SummaryCard title="Bản nháp" value={summary.drafts || 0} description="Chưa công khai" accent="text-amber-600" />
        <SummaryCard title="Trạng thái" value={statusFilter === 'published' ? 'Xuất bản' : statusFilter === 'draft' ? 'Bản nháp' : 'Tất cả'} description="Bộ lọc hiện tại" accent="text-slate-600" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {STATUS_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      setStatusFilter(filter.value);
                      setPage(1);
                    }}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      statusFilter === filter.value
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Tìm theo tiêu đề hoặc tác giả"
                  className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>
            </div>

            {isError ? (
              <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-6 text-red-600">
                Không thể tải danh sách bài viết. Vui lòng thử lại.
              </div>
            ) : isLoading ? (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : blogs.length ? (
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                {blogs.map((blog) => {
                  if (!blog || !blog.id) {
                    console.warn('Skipping blog without ID:', blog);
                    return null;
                  }
                  return (
                  <div
                    key={blog.id}
                    className={`rounded-2xl border p-5 transition-colors ${
                      editingPost?.id === blog.id ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-slate-100 bg-white hover:border-amber-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 line-clamp-2">{blog.title}</p>
                        <p className="text-xs text-slate-500">{blog.author}</p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          blog.is_published ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {blog.is_published ? 'Xuất bản' : 'Bản nháp'}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-500 line-clamp-3">{blog.excerpt || 'Chưa có mô tả tóm tắt.'}</p>
                    <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(blog.updated_at || blog.created_at)}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSelectPost(blog)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs hover:bg-slate-100"
                        >
                          <Edit3 className="w-4 h-4" /> Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(blog)}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" /> Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                }).filter(Boolean)}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-slate-100 p-10 text-center text-slate-500">
                Chưa có bài viết nào. Hãy bắt đầu với một bài viết mới.
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

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-xl font-semibold text-slate-900">
            {editingPost ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
          </h2>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-500">Tiêu đề</label>
              <input
                type="text"
                value={formData.title}
                onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                placeholder="Tên bài viết"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-slate-500">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(event) => setFormData((prev) => ({ ...prev, slug: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                placeholder="duong-dan-bai-viet"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-slate-500">Tác giả</label>
              <input
                type="text"
                value={formData.author}
                onChange={(event) => setFormData((prev) => ({ ...prev, author: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                placeholder="Rare Parfume Team"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-slate-500">Ảnh đại diện</label>
              
              {/* Image Preview */}
              {imagePreview && (
                <div className="mt-2 relative">
                  <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      title="Xóa ảnh"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div className="mt-2 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="blog-image-upload"
                />
                <label
                  htmlFor="blog-image-upload"
                  className={`flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed px-4 py-6 cursor-pointer transition-colors ${
                    isUploading
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-slate-300 hover:border-amber-400 hover:bg-amber-50'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                      <span className="text-sm text-amber-600">Đang tải ảnh...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-slate-400" />
                      <span className="text-sm text-slate-600">
                        {imagePreview ? 'Thay đổi ảnh' : 'Tải ảnh lên từ thiết bị'}
                      </span>
                    </>
                  )}
                </label>
              </div>

              {/* URL Input (Optional - for external images) */}
              <div className="mt-2">
                <input
                  type="url"
                  value={formData.featured_image && !formData.featured_image.startsWith('data:') ? formData.featured_image : ''}
                  onChange={(event) => {
                    const url = event.target.value;
                    setFormData((prev) => ({ ...prev, featured_image: url }));
                    setImagePreview(url || null);
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  placeholder="Hoặc nhập URL ảnh (https://...)"
                />
                <p className="mt-1 text-xs text-slate-400">Bạn có thể nhập URL ảnh từ internet thay vì tải lên</p>
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-slate-500">Tóm tắt</label>
              <textarea
                rows={2}
                value={formData.excerpt}
                onChange={(event) => setFormData((prev) => ({ ...prev, excerpt: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                placeholder="Mô tả ngắn gọn nội dung bài viết"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-slate-500">Nội dung</label>
              <textarea
                rows={6}
                value={formData.content}
                onChange={(event) => setFormData((prev) => ({ ...prev, content: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                placeholder="Nội dung chi tiết bài viết"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(event) => setFormData((prev) => ({ ...prev, is_published: event.target.checked }))}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              Xuất bản bài viết ngay
            </label>

            <button
              type="submit"
              disabled={createMutation.isLoading || updateMutation.isLoading}
              className="btn-primary flex items-center justify-center gap-2"
            >
              {createMutation.isLoading || updateMutation.isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <BookOpen className="w-4 h-4" />
              )}
              <span>{editingPost ? 'Cập nhật bài viết' : 'Đăng bài viết'}</span>
            </button>
          </form>
        </div>
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
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export default AdminBlogsPage;
