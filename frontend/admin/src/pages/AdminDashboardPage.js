import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  LogOut,
  Menu,
  X,
  Users2,
  Loader2,
  AlertCircle,
  Inbox,
  MessageCircle,
  BookOpen,
  Sparkles,
  Award,
  Package2,
  DollarSign,
  UserCircle2,
  PhoneCall,
  ArrowUpRight,
  RotateCcw
} from 'lucide-react';
import { fetchDashboardData } from '../services/api';
import toast from 'react-hot-toast';

const roleLabels = {
  admin: 'Quản trị viên',
  sale: 'Nhân viên bán hàng'
};

const roleBadgeClasses = {
  admin: 'bg-emerald-100 text-emerald-700',
  sale: 'bg-blue-100 text-blue-700'
};

const feedbackStatusClasses = {
  new: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-slate-100 text-slate-600'
};

const MENU_CONFIG = [
  { name: 'Tổng quan', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'sale'] },
  { name: 'Đơn hàng', path: '/orders', icon: ShoppingCart, roles: ['admin', 'sale'] },
  { name: 'Sản phẩm', path: '/products', icon: Package, roles: ['admin'] },
  { name: 'Khách hàng', path: '/customers', icon: Users2, roles: ['admin', 'sale'] },
  { name: 'Feedback', path: '/feedback', icon: MessageCircle, roles: ['admin', 'sale'] },
  { name: 'Blogs', path: '/blogs', icon: BookOpen, roles: ['admin'] }
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Check if user has token before making API calls
  const [hasToken, setHasToken] = useState(() => {
    const token = localStorage.getItem('adminToken');
    console.log('🟣 [AdminLayout] Initial token check:', { hasToken: !!token, tokenLength: token?.length });
    return !!token;
  });

  // Update token state when it changes
  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('adminToken');
      const newHasToken = !!token;
      console.log('🟣 [AdminLayout] Token check:', { 
        hasToken: newHasToken, 
        tokenLength: token?.length,
        currentState: hasToken
      });
      setHasToken(newHasToken);
    };

    // Check token on mount
    console.log('🟣 [AdminLayout] Component mounted, checking token...');
    checkToken();
    
    // Listen for storage changes (when token is removed in another tab/window)
    window.addEventListener('storage', checkToken);
    
    return () => {
      window.removeEventListener('storage', checkToken);
    };
  }, []);

  console.log('🟣 [AdminLayout] Render:', { 
    hasToken, 
    willFetch: hasToken,
    currentPath: location.pathname 
  });

  const {
    data: dashboardData,
    isLoading,
    isError,
    refetch
  } = useQuery('dashboard-data', fetchDashboardData, {
    enabled: hasToken, // Only fetch if token exists
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    staleTime: 60000,
    retry: (failureCount, error) => {
      console.log('🟣 [AdminLayout] Query retry check:', {
        failureCount,
        status: error?.response?.status,
        willRetry: error?.response?.status !== 401 && failureCount < 2
      });
      // Don't retry on 401 errors
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
    onSuccess: (data) => {
      console.log('🟣 [AdminLayout] Query success:', {
        hasData: !!data,
        hasUser: !!data?.user,
        userEmail: data?.user?.email
      });
    },
    onError: (error) => {
      const errorStatus = error?.response?.status || error?.status;
      const errorMessage = error?.message || 'Không thể tải dữ liệu';
      
      console.error('🔴 [AdminLayout] Query error:', {
        status: errorStatus,
        message: errorMessage,
        originalError: error?.originalError,
        data: error?.response?.data || error?.data,
        isAuthError: error?.isAuthError || errorStatus === 401,
        stack: error?.stack
      });
      
      // If we get 401, remove token and redirect
      if (errorStatus === 401 || error?.isAuthError) {
        console.warn('🟡 [AdminLayout] 401 error - removing token and redirecting');
        localStorage.removeItem('adminToken');
        setHasToken(false);
        
        // Show error toast
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', {
          duration: 4000,
          style: {
            background: '#ef4444',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px'
          }
        });
      } else {
        // Show other errors
        toast.error(`Lỗi: ${errorMessage}`, {
          duration: 5000,
          style: {
            background: '#ef4444',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px'
          }
        });
      }
    }
  });

  // Redirect to login if no token
  useEffect(() => {
    console.log('🟣 [AdminLayout] Token check effect:', { hasToken, currentPath: location.pathname });
    if (!hasToken) {
      console.warn('🟡 [AdminLayout] No token - redirecting to login');
      navigate('/login', { replace: true });
    }
  }, [hasToken, navigate, location.pathname]);

  useEffect(() => {
    if (dashboardData) {
      setLastUpdated(new Date());
    }
  }, [dashboardData]);

  useEffect(() => {
    if (dashboardData?.user?.role === 'sale') {
      if (location.pathname.startsWith('/products') || location.pathname.startsWith('/blogs')) {
        navigate('/orders', { replace: true });
      }
    }
  }, [dashboardData?.user?.role, location.pathname, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  const userRole = dashboardData?.user?.role;
  const menuItems = useMemo(
    () => MENU_CONFIG.filter((item) => !item.roles || item.roles.includes(userRole)),
    [userRole]
  );

  const roleLabel = roleLabels[userRole] || 'Người dùng';
  const badgeClass = roleBadgeClasses[userRole] || 'bg-slate-100 text-slate-700';

  const formattedLastUpdated = lastUpdated
    ? lastUpdated.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  const isInitialLoading = isLoading && !dashboardData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-slate-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur border-r border-slate-100 shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center shadow-inner">
              <span className="text-white font-semibold text-lg">OMS</span>
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Rare Parfume</p>
              <p className="text-xs text-slate-500">Bảng điều khiển</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6 px-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-amber-50 text-amber-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <span
                  className={`p-2 rounded-md transition-colors ${
                    location.pathname.startsWith(item.path)
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </span>
                <span className="font-medium">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-4 mb-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Đăng nhập</p>
            <p className="text-sm font-semibold text-slate-900">{dashboardData?.user?.name || 'Admin'}</p>
            <p className="text-xs text-slate-500 truncate">{dashboardData?.user?.email}</p>
            <p className="text-xs text-slate-400 mt-2">Cập nhật lúc {formattedLastUpdated}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Đăng xuất</span>
          </button>
        </div>
      </aside>

      <div className="lg:pl-72 flex flex-col min-h-screen">
        <header className="bg-white/90 backdrop-blur border-b border-slate-100 shadow-sm sticky top-0 z-30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 h-auto sm:h-16 px-4 sm:px-6 lg:px-8 py-3 sm:py-0">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
                aria-label="Mở menu"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div>
                <p className="text-xs sm:text-sm text-slate-500">Xin chào,</p>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 gap-1 sm:gap-0">
                  <span className="text-sm sm:text-base font-semibold text-slate-900">
                    {dashboardData?.user?.name || 'Admin'}
                  </span>
                  <span className={`px-2 py-0.5 sm:py-1 text-xs rounded-full w-fit ${badgeClass}`}>
                    {roleLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              {isLoading && (
                <span className="flex items-center text-xs text-amber-600 space-x-1">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang đồng bộ...</span>
                </span>
              )}
              <div className="text-xs text-slate-500">
                Cập nhật: <span className="font-medium text-slate-700">{formattedLastUpdated}</span>
              </div>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center justify-center space-x-2 px-3 py-2 text-xs sm:text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors w-full sm:w-auto"
              >
                <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
                <span>Tải lại</span>
              </button>
            </div>
          </div>
          {isError && (
            <div className="bg-red-50 border-t border-red-100 px-4 py-2 text-sm text-red-600 sm:px-6 lg:px-8 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>Không thể tải dữ liệu tổng quan. Vui lòng thử lại.</span>
            </div>
          )}
        </header>

        <div className="lg:hidden border-b border-slate-100 bg-white/90 backdrop-blur">
          <div className="flex items-center space-x-3 overflow-x-auto px-4 py-3 sm:px-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex flex-shrink-0 items-center space-x-2 rounded-full border px-3 py-2 text-sm transition-colors ${
                    isActive ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        <main className="flex-1 px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          {isInitialLoading ? (
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="flex flex-col items-center space-y-3 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p>Đang tải bảng điều khiển...</p>
              </div>
            </div>
          ) : (
            <Outlet context={{ dashboardData, isLoading, isError, refetch, lastUpdated }} />
          )}
        </main>
      </div>
    </div>
  );
};

const AdminDashboardPage = () => {
  // Get data from parent AdminLayout via Outlet context
  const outletContext = useOutletContext() || {};
  const { dashboardData, isLoading, refetch, lastUpdated } = outletContext;
  
  // Handle error state - check if dashboardData is undefined after loading
  const isError = !isLoading && !dashboardData;

  const numberFormatter = useMemo(() => new Intl.NumberFormat('vi-VN'), []);
  const currencyFormatter = useMemo(() => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }), []);
  const heroLastUpdated = useMemo(
    () =>
      lastUpdated
        ? lastUpdated.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
        : 'Đang đồng bộ...'
    ,
    [lastUpdated]
  );

  const stats = useMemo(
    () => [
      {
        name: 'Tổng sản phẩm',
        value: numberFormatter.format(dashboardData?.stats?.total_products || 0),
        icon: Package2,
        color: 'bg-blue-100 text-blue-600'
      },
      {
        name: 'Tổng đơn hàng',
        value: numberFormatter.format(dashboardData?.stats?.total_orders || 0),
        icon: ShoppingCart,
        color: 'bg-emerald-100 text-emerald-600'
      },
      {
        name: 'Doanh thu',
        value: currencyFormatter.format(Number(dashboardData?.stats?.total_revenue || 0)),
        icon: DollarSign,
        color: 'bg-amber-100 text-amber-600'
      },
      {
        name: 'Khách hàng',
        value: numberFormatter.format(dashboardData?.customer_summary?.total_customers || 0),
        icon: Users2,
        color: 'bg-purple-100 text-purple-600'
      }
    ],
    [currencyFormatter, dashboardData, numberFormatter]
  );

  const engagementHighlights = useMemo(
    () => [
      {
        title: 'Feedback cần xử lý',
        value: numberFormatter.format(
          (dashboardData?.feedback_summary?.new || 0) + (dashboardData?.feedback_summary?.in_progress || 0)
        ),
        subtitle: 'Theo dõi yêu cầu khách hàng để phản hồi kịp thời',
        icon: MessageCircle,
        accent: 'bg-rose-50 text-rose-600'
      },
      {
        title: 'Bài viết đã xuất bản',
        value: numberFormatter.format(dashboardData?.blog_summary?.published || 0),
        subtitle: 'Nội dung truyền thông đang hiển thị trên website',
        icon: BookOpen,
        accent: 'bg-sky-50 text-sky-600'
      },
      {
        title: 'Khách hàng VIP',
        value: numberFormatter.format(dashboardData?.customer_summary?.vip_customers || 0),
        subtitle: 'Khách hàng thân thiết cần được chăm sóc đặc biệt',
        icon: Award,
        accent: 'bg-emerald-50 text-emerald-600'
      }
    ],
    [dashboardData, numberFormatter]
  );

  const recentOrders = useMemo(
    () => (dashboardData?.recent_orders || []).slice(0, 5),
    [dashboardData?.recent_orders]
  );

  const recentFeedbacks = useMemo(
    () => dashboardData?.recent_feedbacks || [],
    [dashboardData?.recent_feedbacks]
  );

  const topCustomers = useMemo(
    () => dashboardData?.top_customers || [],
    [dashboardData?.top_customers]
  );

  const statusLabels = {
    pending: 'Chờ xử lý',
    paid: 'Đã thanh toán',
    shipped: 'Đang giao hàng',
    delivered: 'Đã giao hàng',
    cancelled: 'Đã hủy'
  };

  const statusClasses = {
    pending: 'bg-amber-100 text-amber-800',
    paid: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-rose-100 text-rose-700'
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Safety check: if context is not available, show loading
  if (!dashboardData && !isLoading && !isError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center text-red-600">
        <div className="flex flex-col items-center space-y-3">
          <AlertCircle className="w-10 h-10" />
          <p className="text-lg font-semibold">Không thể tải dữ liệu tổng quan</p>
          <p className="text-sm text-red-500">Vui lòng kiểm tra kết nối và thử lại.</p>
          {refetch && (
            <button
              onClick={() => refetch()}
              className="btn-primary px-5"
            >
              Thử lại
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Tổng quan hoạt động</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Theo dõi tình hình kinh doanh và hiệu suất đơn hàng gần đây.</p>
        </div>
        {refetch && (
          <button
            onClick={() => refetch()}
            className="btn-primary flex items-center justify-center space-x-1.5 self-start sm:self-auto w-full sm:w-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Làm mới dữ liệu</span>
          </button>
        )}
      </div>

      <section>
        {isLoading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.name}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 sm:p-4 card-hover"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 truncate">{stat.name}</p>
                      <p className="mt-1 text-base sm:text-lg lg:text-xl font-semibold text-slate-900 truncate">{stat.value}</p>
                    </div>
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-lg flex items-center justify-center flex-shrink-0 ml-2 sm:ml-3 ${stat.color}`}>
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {engagementHighlights.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-slate-100 rounded-xl p-3 sm:p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{item.title}</p>
                  <p className="mt-1.5 sm:mt-2 text-lg sm:text-xl lg:text-2xl font-semibold text-slate-900">{item.value}</p>
                </div>
                <div className={`rounded-lg p-2 sm:p-2.5 ${item.accent}`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </div>
              </div>
              <p className="mt-2 sm:mt-3 text-xs text-slate-500 leading-relaxed">{item.subtitle}</p>
            </motion.div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-3 sm:space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900">Đơn hàng gần đây</h2>
                <p className="text-xs text-slate-500">Theo dõi 5 đơn hàng mới nhất và trạng thái xử lý</p>
              </div>
              <ArrowUpRight className="hidden sm:block w-4 h-4 text-amber-500" />
            </div>

            {isLoading ? (
              <OrdersSkeleton />
            ) : recentOrders.length ? (
              <>
                <div className="hidden lg:block">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-100">
                          <th className="py-3 px-4">Mã đơn hàng</th>
                          <th className="py-3 px-4">Khách hàng</th>
                          <th className="py-3 px-4">Tổng tiền</th>
                          <th className="py-3 px-4">Trạng thái</th>
                          <th className="py-3 px-4">Ngày tạo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recentOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-4">
                              <p className="font-semibold text-slate-900">{order.order_number}</p>
                              <p className="text-xs text-slate-500">{order.payment_method}</p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="font-medium text-slate-900">{order.customer_name}</p>
                              <p className="text-xs text-slate-500">{order.customer_email}</p>
                            </td>
                            <td className="py-4 px-4 font-semibold text-slate-900">
                              {currencyFormatter.format(Number(order.total_amount || 0))}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                statusClasses[order.status] || 'bg-slate-100 text-slate-700'
                              }`}
                              >
                                {statusLabels[order.status] || order.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-500">{formatDate(order.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-4 lg:hidden">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="rounded-2xl border border-slate-100 p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{order.order_number}</p>
                          <p className="text-xs text-slate-500">{formatDate(order.created_at)}</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          statusClasses[order.status] || 'bg-slate-100 text-slate-700'
                        }`}
                        >
                          {statusLabels[order.status] || order.status}
                        </span>
                      </div>
                      <div className="mt-4 space-y-2 text-sm text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Khách hàng</span>
                          <span className="font-medium text-slate-900">{order.customer_name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Tổng tiền</span>
                          <span className="font-semibold text-slate-900">
                            {currencyFormatter.format(Number(order.total_amount || 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                icon={Inbox}
                title="Chưa có đơn hàng"
                description="Khi có đơn hàng mới, bạn sẽ nhìn thấy tại đây."
              />
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 sm:p-4">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Khách hàng nổi bật</h2>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : topCustomers.length ? (
              <div className="space-y-4">
                {topCustomers.map((customer) => (
                  <div key={customer.email} className="rounded-2xl border border-slate-100 p-4 hover:border-amber-200 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-amber-50 p-3 text-amber-600">
                          <UserCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{customer.name || customer.email}</p>
                          <p className="text-xs text-slate-500">{customer.email}</p>
                        </div>
                      </div>
                      {customer.vip_status !== 'standard' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                          <Award className="w-4 h-4" /> {customer.vip_status?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-500">
                      <div>
                        <p className="text-xs uppercase tracking-wide">Số đơn</p>
                        <p className="font-semibold text-slate-900">{numberFormatter.format(customer.total_orders || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide">Tổng chi tiêu</p>
                        <p className="font-semibold text-slate-900">
                          {currencyFormatter.format(Number(customer.total_spent || 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Users2}
                title="Chưa có dữ liệu khách hàng"
                description="Khách hàng sẽ xuất hiện tại đây sau khi có đơn hàng."
              />
            )}
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 sm:p-4">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Feedback mới nhất</h2>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : recentFeedbacks.length ? (
              <div className="space-y-4">
                {recentFeedbacks.map((feedback) => (
                  <div key={feedback.id} className="rounded-2xl border border-slate-100 p-4 hover:border-amber-200 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-rose-50 p-3 text-rose-500">
                          <MessageCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{feedback.customer_name || feedback.customer_email}</p>
                          <p className="text-xs text-slate-500">{feedback.customer_email}</p>
                          <p className="mt-2 text-sm text-slate-600 line-clamp-2">{feedback.message}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        feedbackStatusClasses[feedback.status] || 'bg-slate-100 text-slate-600'
                      }`}
                      >
                        {feedback.status === 'in_progress' ? 'Đang xử lý' : feedback.status === 'new' ? 'Mới' : feedback.status === 'resolved' ? 'Đã xử lý' : 'Lưu trữ'}
                      </span>
                    </div>
                    {feedback.rating ? (
                      <div className="mt-3 flex items-center gap-2 text-xs font-medium text-amber-600">
                        <Sparkles className="w-4 h-4" />
                        {feedback.rating}/5 đánh giá
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={MessageCircle}
                title="Chưa có phản hồi"
                description="Khi khách hàng gửi feedback, bạn sẽ thấy thông tin tại đây."
              />
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 sm:p-4">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Liên hệ nhanh</h2>
          <div className="space-y-4 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-emerald-50 p-3 text-emerald-600">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Hotline chăm sóc khách hàng</p>
                  <p className="text-xs text-slate-500">Hỗ trợ khách hàng VIP và phản hồi nhanh</p>
                </div>
              </div>
              <a
                href="tel:19001234"
                className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-200"
              >
                1900 1234
              </a>
            </div>
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-500">
              Đừng quên ghi chú kết quả sau mỗi cuộc gọi trong phần quản lý khách hàng để đội ngũ nắm thông tin chính xác.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const StatsSkeleton = () => (
  <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-5 sm:grid-cols-2 xl:grid-cols-4">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 sm:p-4 animate-pulse">
        <div className="h-3 w-20 bg-slate-200 rounded mb-2 sm:mb-3" />
        <div className="h-5 sm:h-6 lg:h-7 w-28 bg-slate-200 rounded" />
      </div>
    ))}
  </div>
);

const OrdersSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
    ))}
  </div>
);

const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 space-y-3">
    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
      <Icon className="w-6 h-6 text-slate-400" />
    </div>
    <p className="text-lg font-semibold text-slate-700">{title}</p>
    <p className="text-sm text-slate-500 max-w-sm">{description}</p>
  </div>
);

export { AdminLayout, AdminDashboardPage };
