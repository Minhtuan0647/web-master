import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, LogIn, AlertCircle, CheckCircle } from 'lucide-react';
import { adminLogin } from '../../services/api';
import toast from 'react-hot-toast';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { register, handleSubmit, formState: { errors, isValid }, watch } = useForm({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const emailValue = watch('email');
  const passwordValue = watch('password');

  // Check if form is valid for real-time feedback
  const isFormValid = isValid && emailValue && passwordValue;

  useEffect(() => {
    if (localStorage.getItem('adminToken')) {
      setRememberMe(true);
    }
  }, []);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        email: data.email.trim()
      };

      const response = await adminLogin(payload);

      // Store token securely based on remember me
      if (rememberMe) {
        localStorage.setItem('adminToken', response.token);
        sessionStorage.removeItem('adminToken');
      } else {
        sessionStorage.setItem('adminToken', response.token);
        localStorage.removeItem('adminToken');
      }

      toast.success('Đăng nhập thành công!');
      navigate('/admin/dashboard');

    } catch (error) {
      console.error('Login error:', error);
      toast.error('Email hoặc mật khẩu không đúng');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl flex items-center justify-center mb-6">
            <span className="text-white font-bold text-2xl">R</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Đăng nhập Admin
          </h2>
          <p className="text-gray-600">
            Truy cập vào hệ thống quản lý Rare Parfume
          </p>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" autoComplete="on" noValidate>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="admin_email">
                Email
              </label>
              <div className="relative">
                <input
                  id="admin_email"
                  type="email"
                  {...register('email', {
                    required: 'Vui lòng nhập email',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email không hợp lệ'
                    }
                  })}
                  autoComplete="username"
                  className={`input-field pr-12 ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : emailValue && !errors.email ? 'border-green-300 focus:border-green-500 focus:ring-green-500' : ''}`}
                  placeholder="admin@rareparfume.com"
                  />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {emailValue && !errors.email && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {errors.email && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="admin_password">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="admin_password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Vui lòng nhập mật khẩu',
                    minLength: {
                      value: 6,
                      message: 'Mật khẩu phải có ít nhất 6 ký tự'
                    }
                  })}
                  autoComplete="current-password"
                  className={`input-field pr-12 ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : passwordValue && !errors.password ? 'border-green-300 focus:border-green-500 focus:ring-green-500' : ''}`}
                  placeholder="Nhập mật khẩu"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <div className="absolute right-16 top-1/2 transform -translate-y-1/2">
                  {passwordValue && !errors.password && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {errors.password && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="ml-2 text-sm text-gray-700">Ghi nhớ đăng nhập</span>
              </label>

              <button
                type="button"
                className="text-sm text-amber-600 hover:text-amber-800"
                onClick={() => toast.info('Chức năng quên mật khẩu đang được phát triển')}
              >
                Quên mật khẩu?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                isFormValid && !isLoading
                  ? 'btn-primary hover:shadow-lg transform hover:scale-[1.02]'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <LogIn className={`w-5 h-5 ${isLoading ? 'animate-pulse' : ''}`} />
              <span>{isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Thông tin demo:</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>Email:</strong> admin@rareparfume.com</p>
              <p><strong>Mật khẩu:</strong> admin123</p>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <p className="text-sm text-gray-600">
            © 2024 Rare Parfume. Tất cả quyền được bảo lưu.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminLoginPage;
