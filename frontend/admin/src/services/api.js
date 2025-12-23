import axios from 'axios';

const getBaseURL = () => {
  const envUrl = process.env.REACT_APP_API_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    const isLocalhost = ['localhost', '127.0.0.1'].includes(hostname);

    if (!isLocalhost) {
      return `${origin.replace(/\/$/, '')}/api`;
    }
  }

  return '/api';
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('adminToken');
    console.log('🟢 [API Interceptor] Request:', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      tokenLength: token?.length,
      tokenPreview: token ? `${token.substring(0, 20)}...` : null
    });
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🟢 [API Interceptor] Authorization header added');
    } else {
      console.warn('🟡 [API Interceptor] No token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('🔴 [API Interceptor] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('🟢 [API Interceptor] Response success:', {
      url: response.config.url,
      status: response.status,
      statusText: response.statusText
    });
    return response;
  },
  (error) => {
    console.error('🔴 [API Interceptor] Response error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      currentPath: window.location.pathname
    });

    if (error.response?.status === 401) {
      // Handle unauthorized access
      const token = localStorage.getItem('adminToken');
      console.warn('🟡 [API Interceptor] 401 Unauthorized detected:', {
        hasToken: !!token,
        currentPath: window.location.pathname,
        isLoginPage: window.location.pathname.includes('/login')
      });
      
      // Only redirect if we have a token (meaning it's invalid/expired)
      // Don't redirect if we're already on login page
      if (token && !window.location.pathname.includes('/login')) {
        console.warn('🟡 [API Interceptor] Removing token and redirecting to login...');
        localStorage.removeItem('adminToken');
        // Use navigate instead of window.location to avoid full page reload
        // But since we're in an interceptor, we need to use window.location
        // Delay redirect to avoid race conditions
        setTimeout(() => {
          console.warn('🟡 [API Interceptor] Redirecting to /login now...');
          window.location.href = '/login';
        }, 100);
      } else {
        console.log('🟢 [API Interceptor] Not redirecting:', {
          reason: !token ? 'No token found' : 'Already on login page'
        });
      }
    }
    return Promise.reject(error);
  }
);

// Helper function to format error messages
const formatErrorMessage = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    if (data?.error) {
      return data.error;
    }
    if (status === 401) {
      return 'Email hoặc mật khẩu không đúng';
    }
    if (status === 403) {
      return 'Bạn không có quyền truy cập';
    }
    if (status === 404) {
      return 'API endpoint không tồn tại';
    }
    if (status === 500) {
      return 'Lỗi server. Vui lòng thử lại sau';
    }
    return `Lỗi ${status}: ${data?.message || error.message}`;
  } else if (error.request) {
    // Request was made but no response received
    return 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng';
  } else {
    // Something else happened
    return error.message || 'Đã xảy ra lỗi không xác định';
  }
};

// Admin API
export const adminLogin = async (credentials) => {
  try {
    console.log('🔵 [adminLogin] Starting login request...');
    const response = await api.post('/admin/login', credentials);
    console.log('🟢 [adminLogin] Login successful');
    return response.data;
  } catch (error) {
    const errorMessage = formatErrorMessage(error);
    console.error('🔴 [adminLogin] Login failed:', {
      message: errorMessage,
      originalError: error.message,
      status: error.response?.status,
      data: error.response?.data,
      stack: error.stack
    });
    
    // Create a new error with formatted message
    const formattedError = new Error(errorMessage);
    formattedError.originalError = error;
    formattedError.status = error.response?.status;
    formattedError.data = error.response?.data;
    throw formattedError;
  }
};

export const fetchAdminOrders = async (params = {}) => {
  try {
    const response = await api.get('/admin/orders', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    throw error;
  }
};

export const updateOrderStatus = async (id, status) => {
  try {
    const response = await api.put(`/admin/orders/${id}`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

export const fetchAdminProducts = async (params = {}) => {
  try {
    const response = await api.get('/admin/products', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching admin products:', error);
    throw error;
  }
};

export const createProduct = async (productData) => {
  try {
    const response = await api.post('/admin/products', productData);
    return response.data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

export const updateProduct = async (id, productData) => {
  try {
    const response = await api.put(`/admin/products/${id}`, productData);
    return response.data;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    const response = await api.delete(`/admin/products/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

export const fetchDashboardData = async () => {
  try {
    console.log('🔵 [fetchDashboardData] Starting API call...');
    const token = localStorage.getItem('adminToken');
    console.log('🔵 [fetchDashboardData] Token check:', { 
      hasToken: !!token, 
      tokenLength: token?.length 
    });
    
    if (!token) {
      const error = new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      error.status = 401;
      error.isAuthError = true;
      throw error;
    }
    
    const response = await api.get('/admin/dashboard');
    console.log('🟢 [fetchDashboardData] API call successful:', {
      status: response.status,
      hasData: !!response.data,
      dataKeys: response.data ? Object.keys(response.data) : []
    });
    return response.data;
  } catch (error) {
    const errorMessage = formatErrorMessage(error);
    console.error('🔴 [fetchDashboardData] Error:', {
      message: errorMessage,
      originalMessage: error.message,
      status: error.response?.status || error.status,
      data: error.response?.data,
      isAuthError: error.isAuthError || error.response?.status === 401,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      },
      stack: error.stack
    });
    
    // Create a new error with formatted message
    const formattedError = new Error(errorMessage);
    formattedError.originalError = error;
    formattedError.status = error.response?.status || error.status;
    formattedError.data = error.response?.data;
    formattedError.isAuthError = error.isAuthError || error.response?.status === 401;
    throw formattedError;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/admin/profile');
    return response.data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
};

export const fetchAdminFeedbacks = async (params = {}) => {
  try {
    const response = await api.get('/admin/feedbacks', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching admin feedbacks:', error);
    throw error;
  }
};

export const createFeedbackNote = async (data) => {
  try {
    const response = await api.post('/admin/feedbacks', data);
    return response.data;
  } catch (error) {
    console.error('Error creating admin feedback:', error);
    throw error;
  }
};

export const updateFeedback = async (id, data) => {
  try {
    const response = await api.patch(`/admin/feedbacks/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating admin feedback:', error);
    throw error;
  }
};

export const fetchAdminCustomers = async (params = {}) => {
  try {
    const response = await api.get('/admin/customers', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching admin customers:', error);
    throw error;
  }
};

export const fetchCustomerDetail = async (email) => {
  try {
    const response = await api.get(`/admin/customers/${encodeURIComponent(email)}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching customer detail:', error);
    throw error;
  }
};

export const updateCustomerProfile = async (email, data) => {
  try {
    const response = await api.put(`/admin/customers/${encodeURIComponent(email)}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating customer profile:', error);
    throw error;
  }
};

export const fetchAdminBlogs = async (params = {}) => {
  try {
    const response = await api.get('/admin/blogs', { 
      params,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching admin blogs:', error);
    throw error;
  }
};

export const createBlogPost = async (data) => {
  try {
    const response = await api.post('/admin/blogs', data);
    return response.data;
  } catch (error) {
    console.error('Error creating blog post:', error);
    throw error;
  }
};

export const updateBlogPost = async (id, data) => {
  try {
    const response = await api.put(`/admin/blogs/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating blog post:', error);
    throw error;
  }
};

export const deleteBlogPost = async (id) => {
  try {
    if (!id || id === null || id === undefined) {
      throw new Error('Blog post ID is required');
    }

    const blogId = String(id).trim();
    if (!blogId || blogId === 'null' || blogId === 'undefined') {
      throw new Error('Invalid blog post ID');
    }

    const response = await api.delete(`/admin/blogs/${blogId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting blog post:', error);
    throw error;
  }
};

export default api;
