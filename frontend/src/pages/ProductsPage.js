import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { Search, Filter, Grid, List, X } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { fetchProducts, fetchBrands, fetchCategories } from '../services/api';
import toast from 'react-hot-toast';

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    brand: searchParams.get('brand') || '',
    category: searchParams.get('category') || '',
    gender: searchParams.get('gender') || '',
    product_type: searchParams.get('product_type') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    volume: searchParams.get('volume') || '',
    featured: searchParams.get('featured') || '',
    sort: searchParams.get('sort') || '',
  });
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch brands and categories
  const { data: brands = [] } = useQuery('brands', fetchBrands);
  const { data: categories = [] } = useQuery('categories', fetchCategories);

  // Fetch products with filters
  const { data: productsData, isLoading, error } = useQuery(
    ['products', filters, currentPage],
    () => {
      const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});
      
      return fetchProducts({ ...cleanFilters, page: currentPage, limit: 12 });
    },
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000,
      retry: 2,
      onError: () => {
        toast.error('Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.');
      }
    }
  );

  const products = productsData?.products || [];
  const pagination = productsData?.pagination || {};

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    if (currentPage > 1) params.set('page', currentPage);
    setSearchParams(params);
  }, [filters, currentPage, setSearchParams]);

  // Sync filters with URL params on mount
  useEffect(() => {
    const newFilters = {
      search: searchParams.get('search') || '',
      brand: searchParams.get('brand') || '',
      category: searchParams.get('category') || '',
      gender: searchParams.get('gender') || '',
      product_type: searchParams.get('product_type') || '',
      min_price: searchParams.get('min_price') || '',
      max_price: searchParams.get('max_price') || '',
      volume: searchParams.get('volume') || '',
      featured: searchParams.get('featured') || '',
      sort: searchParams.get('sort') || '',
    };
    setFilters(newFilters);
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const searchValue = e.target.search.value;
    handleFilterChange('search', searchValue);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      brand: '',
      category: '',
      gender: '',
      product_type: '',
      min_price: '',
      max_price: '',
      volume: '',
      featured: '',
      sort: '',
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  const volumeOptions = [10, 30, 50, 100, 150, 200];

  const genderOptions = [
    { value: '', label: 'Tất cả' },
    { value: 'male', label: 'Nam' },
    { value: 'female', label: 'Nữ' },
    { value: 'unisex', label: 'Unisex' },
  ];

  const productTypeOptions = [
    { value: '', label: 'Tất cả' },
    { value: 'full_bottle', label: 'Full bottle' },
    { value: 'decant', label: 'Chiết' },
    { value: 'sample', label: 'Sample' },
    { value: 'gift_set', label: 'Gift set' },
  ];

  const sortOptions = [
    { value: '', label: 'Mặc định' },
    { value: 'newest', label: 'Mới nhất' },
    { value: 'price_asc', label: 'Giá tăng dần' },
    { value: 'price_desc', label: 'Giá giảm dần' },
    { value: 'name_asc', label: 'Tên A-Z' },
    { value: 'name_desc', label: 'Tên Z-A' },
  ];

  // Get page title based on filters
  const getPageTitle = () => {
    if (filters.gender === 'male') return 'Nước hoa Nam';
    if (filters.gender === 'female') return 'Nước hoa Nữ';
    if (filters.gender === 'unisex') return 'Nước hoa Unisex';
    if (filters.product_type === 'decant') return 'Nước hoa Chiết';
    if (filters.brand) return `Thương hiệu: ${filters.brand}`;
    if (filters.search) return `Kết quả tìm kiếm: "${filters.search}"`;
    return 'Tất cả sản phẩm';
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Có lỗi xảy ra</h2>
          <p className="text-gray-600">Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mb-2">
            {getPageTitle()}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Khám phá bộ sưu tập nước hoa niche độc đáo của chúng tôi
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Filters Sidebar - Desktop */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white border border-gray-200 rounded-lg p-5 sticky top-32">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Bộ lọc</h2>

              {/* Search */}
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    name="search"
                    placeholder="Tìm kiếm..."
                    defaultValue={filters.search}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </form>

              {/* Gender Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Giới tính
                </label>
                <select
                  value={filters.gender}
                  onChange={(e) => handleFilterChange('gender', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  {genderOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Product Type Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Loại sản phẩm
                </label>
                <select
                  value={filters.product_type}
                  onChange={(e) => handleFilterChange('product_type', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  {productTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Brand Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Thương hiệu
                </label>
                <select
                  value={filters.brand}
                  onChange={(e) => handleFilterChange('brand', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">Tất cả thương hiệu</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Danh mục
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Khoảng giá
                </label>
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="Giá tối thiểu"
                    value={filters.min_price}
                    onChange={(e) => handleFilterChange('min_price', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  <input
                    type="number"
                    placeholder="Giá tối đa"
                    value={filters.max_price}
                    onChange={(e) => handleFilterChange('max_price', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Volume Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Dung tích
                </label>
                <select
                  value={filters.volume}
                  onChange={(e) => handleFilterChange('volume', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">Tất cả dung tích</option>
                  {volumeOptions.map((volume) => (
                    <option key={volume} value={volume}>{volume}ml</option>
                  ))}
                </select>
              </div>

              {/* Featured Filter */}
              <div className="mb-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.featured === 'true'}
                    onChange={(e) => handleFilterChange('featured', e.target.checked ? 'true' : '')}
                    className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Chỉ sản phẩm nổi bật</span>
                </label>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>

          {/* Mobile Filter Button & Slide-out Panel */}
          <div className="lg:hidden mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" />
                Bộ lọc
                {hasActiveFilters && (
                  <span className="w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                    !
                  </span>
                )}
              </button>

              {/* Mobile Sort */}
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile Filter Panel */}
          {showFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
              <div className="absolute right-0 top-0 h-full w-80 max-w-full bg-white shadow-xl overflow-y-auto">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Bộ lọc</h2>
                  <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  {/* Search */}
                  <form onSubmit={(e) => { handleSearch(e); setShowFilters(false); }}>
                    <div className="relative">
                      <input
                        type="text"
                        name="search"
                        placeholder="Tìm kiếm..."
                        defaultValue={filters.search}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
                  </form>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Giới tính</label>
                    <select
                      value={filters.gender}
                      onChange={(e) => handleFilterChange('gender', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                    >
                      {genderOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Product Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Loại sản phẩm</label>
                    <select
                      value={filters.product_type}
                      onChange={(e) => handleFilterChange('product_type', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                    >
                      {productTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Thương hiệu</label>
                    <select
                      value={filters.brand}
                      onChange={(e) => handleFilterChange('brand', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                    >
                      <option value="">Tất cả</option>
                      {brands.map((brand) => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Danh mục</label>
                    <select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                    >
                      <option value="">Tất cả</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Khoảng giá</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Từ"
                        value={filters.min_price}
                        onChange={(e) => handleFilterChange('min_price', e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
                      />
                      <input
                        type="number"
                        placeholder="Đến"
                        value={filters.max_price}
                        onChange={(e) => handleFilterChange('max_price', e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Volume */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Dung tích</label>
                    <select
                      value={filters.volume}
                      onChange={(e) => handleFilterChange('volume', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                    >
                      <option value="">Tất cả</option>
                      {volumeOptions.map((volume) => (
                        <option key={volume} value={volume}>{volume}ml</option>
                      ))}
                    </select>
                  </div>

                  {/* Featured */}
                  <div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.featured === 'true'}
                        onChange={(e) => handleFilterChange('featured', e.target.checked ? 'true' : '')}
                        className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Chỉ sản phẩm nổi bật</span>
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-gray-200 flex gap-3">
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="flex-1 py-2.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Xóa bộ lọc
                      </button>
                    )}
                    <button
                      onClick={() => setShowFilters(false)}
                      className="flex-1 py-2.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                    >
                      Xem kết quả
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Section */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
              <div className="text-sm text-gray-600">
                {pagination.total_count ? (
                  <span>Hiển thị {products.length} trong {pagination.total_count} sản phẩm</span>
                ) : (
                  <span>Đang tải...</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Desktop Sort */}
                <div className="hidden lg:flex items-center gap-2">
                  <span className="text-sm text-gray-600">Sắp xếp:</span>
                  <select
                    value={filters.sort}
                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <span className="text-sm text-gray-600 hidden sm:inline ml-4">Xem:</span>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-gray-100 text-amber-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                  aria-label="Xem dạng lưới"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-gray-100 text-amber-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                  aria-label="Xem dạng danh sách"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="flex justify-center items-center py-16">
                <div className="loading-spinner"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Không tìm thấy sản phẩm
                </h3>
                <p className="text-gray-600 mb-4">
                  Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm
                </p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="btn-primary">
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`grid gap-4 sm:gap-6 ${
                    viewMode === 'grid'
                      ? 'grid-cols-2 md:grid-cols-3'
                      : 'grid-cols-1'
                  }`}
                >
                  {products.map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Pagination */}
                {pagination.total_pages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Trước
                    </button>
                    
                    {[...Array(pagination.total_pages)].map((_, index) => {
                      const page = index + 1;
                      if (
                        page === 1 ||
                        page === pagination.total_pages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-4 py-2 text-sm rounded-lg ${
                              page === currentPage
                                ? 'bg-amber-500 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="px-2 text-gray-400">...</span>;
                      }
                      return null;
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.total_pages))}
                      disabled={currentPage === pagination.total_pages}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Sau
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
