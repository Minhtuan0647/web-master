import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  LogOut,
  Menu,
  X,
  TrendingUp,
  Users,
  DollarSign,
  Package2
} from 'lucide-react';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchDashboardData } from '../../services/api';

const AdminLayout = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: dashboardData, isLoading } = useQuery(
    'dashboard-data',
    fetchDashboardData,
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  // Menu items based on user role
  const getMenuItems = (userRole) => {
    const commonItems = [
      { name: 'Tổng quan', path: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Đơn hàng', path: '/admin/orders', icon: ShoppingCart },
    ];

    if (userRole === 'admin') {
      return [
        ...commonItems,
        { name: 'Sản phẩm', path: '/admin/products', icon: Package },
      ];
    }

    return commonItems;
  };

  const menuItems = getMenuItems(dashboardData?.user?.role);

  const stats = [
    {
      name: 'Tổng sản phẩm',
      value: dashboardData?.stats?.total_products || 0,
      icon: Package2,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      name: 'Tổng đơn hàng',
      value: dashboardData?.stats?.total_orders || 0,
      icon: ShoppingCart,
      color: 'text-green-600 bg-green-100'
    },
    {
      name: 'Doanh thu',
      value: `$${dashboardData?.stats?.total_revenue?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'text-amber-600 bg-amber-100'
    },
    {
      name: 'Khách hàng',
      value: '1,234', // This would come from API
      icon: Users,
      color: 'text-purple-600 bg-purple-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-600 to-amber-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Admin</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors duration-200"
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Xin chào, <span className="font-medium text-gray-900">
                  {dashboardData?.user?.name || 'Admin'}
                </span>
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  dashboardData?.user?.role === 'admin'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {dashboardData?.user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên bán hàng'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-3 sm:p-4 lg:p-6 xl:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AdminDashboardPage = () => {
  const { data: dashboardData, isLoading } = useQuery('dashboard-data', fetchDashboardData);

  const stats = [
    {
      name: 'Tổng sản phẩm',
      value: dashboardData?.stats?.total_products || 0,
      icon: Package2,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      name: 'Tổng đơn hàng',
      value: dashboardData?.stats?.total_orders || 0,
      icon: ShoppingCart,
      color: 'text-green-600 bg-green-100'
    },
    {
      name: 'Doanh thu',
      value: `$${dashboardData?.stats?.total_revenue?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'text-amber-600 bg-amber-100'
    },
    {
      name: 'Khách hàng',
      value: '1,234',
      icon: Users,
      color: 'text-purple-600 bg-purple-100'
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tổng quan</h1>
        <p className="text-gray-600">Chào mừng bạn đến với bảng điều khiển quản lý</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Doanh thu 7 ngày qua</h2>
          <TrendingUp className="w-5 h-5 text-green-600" />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <div className="h-64">
            <div className="flex flex-col h-full">
              <div className="flex-1 relative">
                {/* Simple CSS-based chart visualization */}
                <div className="absolute inset-0 flex items-end justify-between">
                  {(dashboardData?.revenue_chart || [
                    { day: 'T2', revenue: 1200 },
                    { day: 'T3', revenue: 1800 },
                    { day: 'T4', revenue: 1500 },
                    { day: 'T5', revenue: 2200 },
                    { day: 'T6', revenue: 1900 },
                    { day: 'T7', revenue: 2500 },
                    { day: 'CN', revenue: 2100 }
                  ]).map((item, index) => {
                    const maxRevenue = Math.max(...(dashboardData?.revenue_chart || [1200, 1800, 1500, 2200, 1900, 2500, 2100]).map(d => d.revenue));
                    const height = (item.revenue / maxRevenue) * 100;

                    return (
                      <div key={index} className="flex flex-col items-center flex-1 mx-1">
                        <div className="text-xs text-gray-600 mb-2">${item.revenue}</div>
                        <div
                          className="w-full bg-gradient-to-t from-amber-400 to-amber-600 rounded-t min-h-[4px]"
                          style={{ height: `${height}%` }}
                        ></div>
                        <div className="text-xs text-gray-500 mt-2">{item.day}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Đơn hàng gần đây</h2>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Mã đơn hàng</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Khách hàng</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Tổng tiền</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Trạng thái</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData?.recent_orders?.slice(0, 5).map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{order.order_number}</td>
                    <td className="py-3 px-4 text-gray-600">{order.customer_name}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">${order.total_amount}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(order.created_at).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-500">
                      Chưa có đơn hàng nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export { AdminLayout, AdminDashboardPage };
