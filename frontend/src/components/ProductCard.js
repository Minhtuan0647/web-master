import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Eye } from 'lucide-react';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    toast.success(`${product.name} đã được thêm vào giỏ hàng!`);
  };

  const handleQuickBuy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    toast.success('Đã thêm vào giỏ hàng!');
  };

  const priceValue = Number(product.price ?? 0);
  const formattedPrice = new Intl.NumberFormat('vi-VN').format(
    Number.isFinite(priceValue) ? priceValue : 0
  ) + '₫';

  // Get primary and secondary images
  const primaryImage = product.image_urls?.[0] || '/images/placeholder.jpg';
  const secondaryImage = product.image_urls?.[1] || primaryImage;

  return (
    <div 
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/products/${product.id}`} className="block">
        {/* Product Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-100 mb-3">
          {/* Primary Image */}
          <img
            src={primaryImage}
            alt={product.name}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              isHovered && secondaryImage !== primaryImage ? 'opacity-0' : 'opacity-100'
            }`}
            loading="lazy"
          />
          
          {/* Secondary Image (shown on hover) */}
          {secondaryImage !== primaryImage && (
            <img
              src={secondaryImage}
              alt={`${product.name} - Hình 2`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
              loading="lazy"
            />
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.is_featured && (
              <span className="bg-amber-500 text-white text-[10px] sm:text-xs font-semibold px-2 py-1">
                Nổi bật
              </span>
            )}
            {product.stock_quantity === 0 && (
              <span className="bg-red-500 text-white text-[10px] sm:text-xs font-semibold px-2 py-1">
                Hết hàng
              </span>
            )}
          </div>

          {/* Quick Actions - Show on hover */}
          <div className={`absolute bottom-0 left-0 right-0 bg-white/95 py-2 px-3 flex items-center justify-center gap-2 transition-all duration-300 ${
            isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
          }`}>
            <button
              onClick={handleQuickBuy}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gray-900 text-white py-2 text-xs sm:text-sm font-medium hover:bg-amber-600 transition-colors"
            >
              Mua ngay
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Price Overlay */}
          <div className="sm:hidden absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 pointer-events-none">
            <span className="text-white font-bold text-sm">{formattedPrice}</span>
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-1">
          {/* Brand */}
          {product.brand && (
            <p className="text-xs text-gray-500 uppercase tracking-wider">{product.brand}</p>
          )}
          
          {/* Product Name */}
          <h3 className="text-sm sm:text-base font-medium text-gray-900 line-clamp-2 group-hover:text-amber-600 transition-colors leading-snug">
            {product.name}
          </h3>
          
          {/* Price */}
          <div className="hidden sm:block">
            <span className="text-base font-semibold text-gray-900">{formattedPrice}</span>
            {product.volume_ml && (
              <span className="text-xs text-gray-500 ml-1">/ {product.volume_ml}ml</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
