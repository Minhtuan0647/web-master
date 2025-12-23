import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { ShoppingCart, Heart, Share2, Star, ArrowLeft, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { fetchProduct, fetchProducts } from '../services/api';
import ProductCard from '../components/ProductCard';
import toast from 'react-hot-toast';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat('vi-VN').format,
    []
  );

  // Fetch product details
  const { data: product, isLoading, error } = useQuery(
    ['product', id],
    () => fetchProduct(id),
    { enabled: !!id }
  );

  // Fetch related products
  const { data: relatedProductsData } = useQuery(
    ['related-products', product?.brand],
    () => fetchProducts({ brand: product?.brand, limit: 4 }),
    { enabled: !!product?.brand }
  );
  const relatedProducts = relatedProductsData?.products || [];

  const handleAddToCart = async () => {
    if (!product) return;
    
    setIsAddingToCart(true);
    try {
      addToCart(product, quantity);
      toast.success(`${product.name} đã được thêm vào giỏ hàng!`);
    } catch (error) {
      toast.error('Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    
    setIsBuyingNow(true);
    try {
      addToCart(product, quantity);
      navigate('/checkout');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng');
      setIsBuyingNow(false);
    }
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= product?.stock_quantity) {
      setQuantity(newQuantity);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sản phẩm không tồn tại</h2>
          <p className="text-gray-600 mb-4">Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <Link to="/products" className="btn-primary">
            Quay lại danh sách sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  const images = product.image_urls || ['/images/placeholder.jpg'];
  const scentNotes = product.scent_notes || {};

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-amber-600">Trang chủ</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-amber-600">Sản phẩm</Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        {/* Back Button */}
        <Link
          to="/products"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-amber-600 mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách sản phẩm</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? 'border-amber-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-5">
            {/* Brand and Name */}
            <div>
              <p className="text-sm text-amber-600 font-medium uppercase tracking-wider mb-1">{product.brand}</p>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">{product.name}</h1>
              
              {/* Rating */}
              <div className="flex items-center space-x-2 mt-3">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="text-sm text-gray-500">(4.8) • 124 đánh giá</span>
              </div>
            </div>

            {/* Price */}
            <div className="pb-5 border-b border-gray-200">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                {currencyFormatter(Number(product.price || 0))}₫
              </span>
              {product.volume_ml && (
                <span className="text-sm text-gray-500 ml-2">/ {product.volume_ml}ml</span>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Mô tả sản phẩm</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Scent Notes */}
            {Object.keys(scentNotes).length > 0 && (
              <div className="pb-5 border-b border-gray-200">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Tầng hương</h3>
                <div className="space-y-3">
                  {scentNotes.top_notes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Hương đầu (Top Notes)</h4>
                      <p className="text-sm text-gray-600">{scentNotes.top_notes.join(', ')}</p>
                    </div>
                  )}
                  {scentNotes.middle_notes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Hương giữa (Middle Notes)</h4>
                      <p className="text-sm text-gray-600">{scentNotes.middle_notes.join(', ')}</p>
                    </div>
                  )}
                  {scentNotes.base_notes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Hương cuối (Base Notes)</h4>
                      <p className="text-sm text-gray-600">{scentNotes.base_notes.join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stock Status */}
            <div className="flex items-center space-x-2">
              {product.stock_quantity > 0 ? (
                <>
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Còn hàng ({product.stock_quantity} sản phẩm)
                  </span>
                </>
              ) : (
                <>
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-red-600">Hết hàng</span>
                </>
              )}
            </div>

            {/* Quantity and Add to Cart */}
            {product.stock_quantity > 0 && (
              <div className="space-y-4">
                {/* Quantity Selector */}
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700">Số lượng:</span>
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                      className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg"
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="px-4 py-2 min-w-[60px] text-center text-sm font-medium">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= product.stock_quantity}
                      className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || isBuyingNow}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-900 text-gray-900 font-semibold rounded-lg hover:bg-gray-900 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>{isAddingToCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}</span>
                  </button>
                  
                  <button
                    onClick={handleBuyNow}
                    disabled={isAddingToCart || isBuyingNow}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>{isBuyingNow ? 'Đang xử lý...' : 'Mua ngay'}</span>
                  </button>
                </div>
                
                {/* Wishlist & Share */}
                <div className="flex space-x-3">
                  <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Heart className="w-5 h-5 text-gray-600" />
                  </button>
                  
                  <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Share2 className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-900 mb-6">Sản phẩm liên quan</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts
                .filter(p => p.id !== product.id)
                .slice(0, 4)
                .map((relatedProduct) => (
                  <motion.div
                    key={relatedProduct.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <ProductCard product={relatedProduct} />
                  </motion.div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
