import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Save,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { 
  fetchAdminProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '../../services/api';
import toast from 'react-hot-toast';

const AdminProductsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const queryClient = useQueryClient();

  const { data: productsData, isLoading } = useQuery(
    ['admin-products', currentPage, searchTerm],
    () => fetchAdminProducts({ page: currentPage, limit: 10, search: searchTerm }),
    {
      keepPreviousData: true,
    }
  );

  const products = productsData?.products || [];
  const pagination = productsData?.pagination || {};
  const isAdmin = productsData?.user?.role === 'admin';

  const createMutation = useMutation(createProduct, {
    onSuccess: () => {
      queryClient.invalidateQueries('admin-products');
      toast.success('Sản phẩm đã được tạo thành công!');
      setShowAddForm(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Có lỗi xảy ra khi tạo sản phẩm');
    }
  });

  const updateMutation = useMutation(
    ({ id, data }) => updateProduct(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-products');
        toast.success('Sản phẩm đã được cập nhật thành công!');
        setEditingProduct(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Có lỗi xảy ra khi cập nhật sản phẩm');
      }
    }
  );

  const deleteMutation = useMutation(deleteProduct, {
    onSuccess: () => {
      queryClient.invalidateQueries('admin-products');
      toast.success('Sản phẩm đã được xóa thành công!');
    },
    onError: () => {
      toast.error('Có lỗi xảy ra khi xóa sản phẩm');
    }
  });

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Truy cập bị từ chối</h2>
          <p className="text-gray-600 mb-6">Bạn không có quyền truy cập trang quản lý sản phẩm.</p>
          <p className="text-sm text-gray-500">Chỉ quản trị viên mới có thể quản lý sản phẩm.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Quản lý sản phẩm
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Thêm, sửa và xóa sản phẩm</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Thêm sản phẩm</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Products Table */}
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
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Sản phẩm</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Thương hiệu</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Giới tính</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Loại</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Giá</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Tồn kho</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Trạng thái</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <img
                          src={product.image_urls?.[0] || '/images/placeholder.jpg'}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                        />
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{product.name}</p>
                          <p className="text-sm text-gray-600">{product.volume_ml}ml</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">{product.brand}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        product.gender === 'male' ? 'bg-blue-100 text-blue-800' :
                        product.gender === 'female' ? 'bg-pink-100 text-pink-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {product.gender === 'male' ? 'Nam' : 
                         product.gender === 'female' ? 'Nữ' : 'Unisex'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-600 text-sm">
                      {product.product_type === 'full_bottle' ? 'Full' :
                       product.product_type === 'decant' ? 'Chiết' :
                       product.product_type === 'sample' ? 'Sample' : 
                       product.product_type || 'Full'}
                    </td>
                    <td className="py-4 px-6 font-medium text-gray-900">{formatPrice(product.price)}</td>
                    <td className="py-4 px-6 text-gray-600">{product.stock_quantity}</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {product.is_featured && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                            Featured
                          </span>
                        )}
                        {product.is_new_arrival && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            New
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
              Hiển thị {products.length} trong tổng số {pagination.total_count} sản phẩm
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

      {/* Add/Edit Product Modal */}
      {(showAddForm || editingProduct) && (
        <ProductForm
          product={editingProduct}
          onClose={() => {
            setShowAddForm(false);
            setEditingProduct(null);
          }}
          onSubmit={(data) => {
            if (editingProduct) {
              updateMutation.mutate({ id: editingProduct.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          isLoading={createMutation.isLoading || updateMutation.isLoading}
        />
      )}
    </div>
  );
};

const ProductForm = ({ product, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    brand: product?.brand || '',
    description: product?.description || '',
    price: product?.price || '',
    sale_price: product?.sale_price || '',
    stock_quantity: product?.stock_quantity || '',
    volume_ml: product?.volume_ml || '',
    category: product?.category || 'perfume',
    gender: product?.gender || 'unisex',
    product_type: product?.product_type || 'full_bottle',
    concentration: product?.concentration || 'EDP',
    origin_country: product?.origin_country || '',
    release_year: product?.release_year || '',
    is_featured: product?.is_featured || false,
    is_new_arrival: product?.is_new_arrival || false,
    is_on_sale: product?.is_on_sale || false,
    is_active: product?.is_active !== false,
    image_urls: product?.image_urls || [],
    scent_notes: product?.scent_notes || {
      top_notes: [],
      middle_notes: [],
      base_notes: []
    }
  });

  const [imageUrlInput, setImageUrlInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.brand || !formData.price || !formData.volume_ml) {
      toast.error('Vui lòng điền đầy đủ các trường bắt buộc');
      return;
    }

    // Prepare data for submission
    const submitData = {
      ...formData,
      price: parseFloat(formData.price),
      sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
      stock_quantity: parseInt(formData.stock_quantity) || 0,
      volume_ml: parseInt(formData.volume_ml),
      release_year: formData.release_year ? parseInt(formData.release_year) : null,
    };

    onSubmit(submitData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleScentNotesChange = (noteType, value) => {
    const notes = value.split(',').map(note => note.trim()).filter(note => note);
    setFormData(prev => ({
      ...prev,
      scent_notes: {
        ...prev.scent_notes,
        [noteType]: notes
      }
    }));
  };

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setFormData(prev => ({
        ...prev,
        image_urls: [...prev.image_urls, imageUrlInput.trim()]
      }));
      setImageUrlInput('');
    }
  };

  const handleRemoveImageUrl = (index) => {
    setFormData(prev => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index)
    }));
  };

  const genderOptions = [
    { value: 'male', label: 'Nam' },
    { value: 'female', label: 'Nữ' },
    { value: 'unisex', label: 'Unisex' },
  ];

  const productTypeOptions = [
    { value: 'full_bottle', label: 'Full bottle' },
    { value: 'decant', label: 'Chiết (Decant)' },
    { value: 'sample', label: 'Sample' },
    { value: 'gift_set', label: 'Gift set' },
  ];

  const concentrationOptions = [
    { value: 'EDT', label: 'Eau de Toilette (EDT)' },
    { value: 'EDP', label: 'Eau de Parfum (EDP)' },
    { value: 'Parfum', label: 'Parfum / Extrait' },
    { value: 'EDC', label: 'Eau de Cologne (EDC)' },
    { value: 'Other', label: 'Khác' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="fixed inset-0 bg-gray-600 opacity-75" onClick={onClose}></div>
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-gray-200 z-10">
            <h2 className="text-xl font-bold text-gray-900">
              {product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Thông tin cơ bản</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên sản phẩm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="input-field"
                    required
                    placeholder="VD: Creed Aventus"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thương hiệu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => handleChange('brand', e.target.value)}
                    className="input-field"
                    required
                    placeholder="VD: Creed"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="input-field"
                  rows={3}
                  required
                  placeholder="Mô tả chi tiết về sản phẩm..."
                />
              </div>
            </div>

            {/* Classification */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Phân loại</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giới tính <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="input-field"
                    required
                  >
                    {genderOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại sản phẩm <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.product_type}
                    onChange={(e) => handleChange('product_type', e.target.value)}
                    className="input-field"
                    required
                  >
                    {productTypeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nồng độ
                  </label>
                  <select
                    value={formData.concentration}
                    onChange={(e) => handleChange('concentration', e.target.value)}
                    className="input-field"
                  >
                    {concentrationOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dung tích (ml) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.volume_ml}
                    onChange={(e) => handleChange('volume_ml', e.target.value)}
                    className="input-field"
                    required
                    min="1"
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Danh mục
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="input-field"
                    placeholder="perfume"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Xuất xứ
                  </label>
                  <input
                    type="text"
                    value={formData.origin_country}
                    onChange={(e) => handleChange('origin_country', e.target.value)}
                    className="input-field"
                    placeholder="France"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Năm phát hành
                  </label>
                  <input
                    type="number"
                    value={formData.release_year}
                    onChange={(e) => handleChange('release_year', e.target.value)}
                    className="input-field"
                    min="1900"
                    max={new Date().getFullYear()}
                    placeholder="2010"
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Stock */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Giá & Tồn kho</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    className="input-field"
                    required
                    min="0"
                    placeholder="3000000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá khuyến mãi
                  </label>
                  <input
                    type="number"
                    value={formData.sale_price}
                    onChange={(e) => handleChange('sale_price', e.target.value)}
                    className="input-field"
                    min="0"
                    placeholder="2500000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tồn kho <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => handleChange('stock_quantity', e.target.value)}
                    className="input-field"
                    required
                    min="0"
                    placeholder="10"
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Hình ảnh</h3>
              <div className="flex gap-2 mb-3">
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="input-field flex-1"
                  placeholder="Nhập URL hình ảnh..."
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium"
                >
                  Thêm
                </button>
              </div>
              
              {formData.image_urls.length > 0 ? (
                <div className="grid grid-cols-4 gap-3">
                  {formData.image_urls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Image ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImageUrl(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded">
                          Chính
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center text-gray-500">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Chưa có hình ảnh</p>
                  </div>
                </div>
              )}
            </div>

            {/* Scent Notes */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Tầng hương</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tầng đầu (Top Notes)</label>
                  <input
                    type="text"
                    placeholder="Bergamot, Lemon, Orange (phân cách bằng dấu phẩy)"
                    value={formData.scent_notes.top_notes?.join(', ') || ''}
                    onChange={(e) => handleScentNotesChange('top_notes', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tầng giữa (Middle Notes)</label>
                  <input
                    type="text"
                    placeholder="Rose, Jasmine, Lavender"
                    value={formData.scent_notes.middle_notes?.join(', ') || ''}
                    onChange={(e) => handleScentNotesChange('middle_notes', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tầng cuối (Base Notes)</label>
                  <input
                    type="text"
                    placeholder="Sandalwood, Musk, Vanilla"
                    value={formData.scent_notes.base_notes?.join(', ') || ''}
                    onChange={(e) => handleScentNotesChange('base_notes', e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Status Flags */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Trạng thái</h3>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Hoạt động</span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => handleChange('is_featured', e.target.checked)}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Nổi bật</span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_new_arrival}
                    onChange={(e) => handleChange('is_new_arrival', e.target.checked)}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Sản phẩm mới</span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_on_sale}
                    onChange={(e) => handleChange('is_on_sale', e.target.checked)}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Đang giảm giá</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Đang lưu...' : 'Lưu sản phẩm'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminProductsPage;
