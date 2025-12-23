import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import BlogCard from '../components/BlogCard';
import { useQuery } from 'react-query';
import { fetchProducts, fetchBlogPosts } from '../services/api';

const HomePage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Hero slider images
  const heroSlides = [
    {
      id: 1,
      image: '/images/hero-slide-1.jpg',
      title: 'Bộ Sưu Tập Mùa Đông',
      subtitle: 'Khám phá những mùi hương ấm áp',
      link: '/products?season=winter'
    },
    {
      id: 2,
      image: '/images/hero-slide-2.jpg',
      title: 'Nước Hoa Cao Cấp',
      subtitle: 'Từ các thương hiệu nổi tiếng thế giới',
      link: '/products'
    },
    {
      id: 3,
      image: '/images/hero-slide-3.jpg',
      title: 'Ưu Đãi Đặc Biệt',
      subtitle: 'Giảm đến 30% các sản phẩm hot',
      link: '/products?sale=true'
    }
  ];

  // Auto slide
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  // Fetch new arrivals
  const { data: newArrivalsData, isLoading: newArrivalsLoading } = useQuery(
    'new-arrivals',
    () => fetchProducts({ sort: 'newest', limit: 6 }),
    { staleTime: 5 * 60 * 1000 }
  );
  const newArrivals = newArrivalsData?.products || [];

  // Fetch featured products
  const { data: featuredData, isLoading: featuredLoading } = useQuery(
    'featured-products',
    () => fetchProducts({ featured: 'true', limit: 6 }),
    { staleTime: 5 * 60 * 1000 }
  );
  const featuredProducts = featuredData?.products || [];

  // Fetch blog posts
  const { data: blogPosts = [], isLoading: blogLoading } = useQuery(
    'recent-blogs',
    () => fetchBlogPosts({ limit: 3 }),
    { staleTime: 10 * 60 * 1000 }
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Slider */}
      <section className="relative h-[50vh] sm:h-[60vh] lg:h-[70vh] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <div 
              className="w-full h-full bg-cover bg-center"
              style={{ 
                backgroundImage: `url(${heroSlides[currentSlide].image})`,
                backgroundColor: '#f5f5f5'
              }}
            >
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/20"></div>
              
              {/* Content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white px-4">
                  <motion.h2
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold mb-3"
                  >
                    {heroSlides[currentSlide].title}
                  </motion.h2>
                  <motion.p
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="text-lg sm:text-xl mb-6"
                  >
                    {heroSlides[currentSlide].subtitle}
                  </motion.p>
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                  >
                    <Link
                      to={heroSlides[currentSlide].link}
                      className="inline-flex items-center bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-amber-500 hover:text-white transition-colors"
                    >
                      Khám phá ngay
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slider Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors z-10"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6 text-gray-800" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors z-10"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6 text-gray-800" />
        </button>

        {/* Slider Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? 'bg-white' : 'bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mb-2">
              <Link to="/products?sort=newest" className="hover:text-amber-600 transition-colors">
                Sản phẩm mới
              </Link>
            </h2>
            <div className="w-20 h-0.5 bg-amber-500 mx-auto"></div>
          </div>

          {/* Products Grid */}
          {newArrivalsLoading ? (
            <div className="flex justify-center py-12">
              <div className="loading-spinner"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {newArrivals.slice(0, 6).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* View All Button */}
          <div className="text-center mt-8">
            <Link
              to="/products?sort=newest"
              className="inline-flex items-center text-gray-900 border-b-2 border-gray-900 pb-1 font-medium hover:text-amber-600 hover:border-amber-600 transition-colors"
            >
              Xem tất cả
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-12 lg:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mb-2">
              <Link to="/products?featured=true" className="hover:text-amber-600 transition-colors">
                Sản phẩm nổi bật
              </Link>
            </h2>
            <div className="w-20 h-0.5 bg-amber-500 mx-auto"></div>
          </div>

          {/* Products Grid */}
          {featuredLoading ? (
            <div className="flex justify-center py-12">
              <div className="loading-spinner"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {featuredProducts.slice(0, 6).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* View All Button */}
          <div className="text-center mt-8">
            <Link
              to="/products?featured=true"
              className="inline-flex items-center text-gray-900 border-b-2 border-gray-900 pb-1 font-medium hover:text-amber-600 hover:border-amber-600 transition-colors"
            >
              Xem tất cả
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Banner */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Nước hoa Nam */}
            <Link to="/products?gender=male" className="group relative overflow-hidden rounded-lg aspect-[3/4]">
              <div className="absolute inset-0 bg-gray-900">
                <img 
                  src="/images/category-men.jpg" 
                  alt="Nước hoa Nam" 
                  className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors"></div>
              <div className="absolute inset-0 flex items-end p-4">
                <h3 className="text-white text-lg sm:text-xl font-semibold">Nước hoa Nam</h3>
              </div>
            </Link>

            {/* Nước hoa Nữ */}
            <Link to="/products?gender=female" className="group relative overflow-hidden rounded-lg aspect-[3/4]">
              <div className="absolute inset-0 bg-gray-900">
                <img 
                  src="/images/category-women.jpg" 
                  alt="Nước hoa Nữ" 
                  className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors"></div>
              <div className="absolute inset-0 flex items-end p-4">
                <h3 className="text-white text-lg sm:text-xl font-semibold">Nước hoa Nữ</h3>
              </div>
            </Link>

            {/* Nước hoa Unisex */}
            <Link to="/products?gender=unisex" className="group relative overflow-hidden rounded-lg aspect-[3/4]">
              <div className="absolute inset-0 bg-gray-900">
                <img 
                  src="/images/category-unisex.jpg" 
                  alt="Nước hoa Unisex" 
                  className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors"></div>
              <div className="absolute inset-0 flex items-end p-4">
                <h3 className="text-white text-lg sm:text-xl font-semibold">Nước hoa Unisex</h3>
              </div>
            </Link>

            {/* Nước hoa Chiết */}
            <Link to="/products?type=decant" className="group relative overflow-hidden rounded-lg aspect-[3/4]">
              <div className="absolute inset-0 bg-gray-900">
                <img 
                  src="/images/category-decant.jpg" 
                  alt="Nước hoa Chiết" 
                  className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors"></div>
              <div className="absolute inset-0 flex items-end p-4">
                <h3 className="text-white text-lg sm:text-xl font-semibold">Nước hoa Chiết</h3>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className="py-12 lg:py-16 bg-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="order-2 lg:order-1">
              <p className="text-amber-600 text-sm font-semibold mb-2 uppercase tracking-wider">Về chúng tôi</p>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mb-4">
                Rare Parfume - Nơi Mùi Hương Trở Thành Nghệ Thuật
              </h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Rare Parfume là nơi hội tụ những người yêu nước hoa, mua bán, trao đổi và thích sưu tầm 
                nước hoa niche cao cấp từ khắp nơi trên thế giới.
              </p>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Chúng tôi tự hào mang đến những sản phẩm chính hãng 100% với đa dạng các thương hiệu 
                từ bình dân đến cao cấp, đáp ứng mọi nhu cầu của khách hàng.
              </p>
              <Link
                to="/about"
                className="inline-flex items-center bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-600 transition-colors"
              >
                Tìm hiểu thêm
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
            <div className="order-1 lg:order-2">
              <div className="relative">
                <img 
                  src="/images/brand-story.jpg" 
                  alt="Rare Parfume Brand Story" 
                  className="w-full rounded-lg shadow-xl"
                />
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-amber-500/20 rounded-full -z-10"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mb-2">
              <Link to="/blog" className="hover:text-amber-600 transition-colors">
                Tin tức & Blog
              </Link>
            </h2>
            <div className="w-20 h-0.5 bg-amber-500 mx-auto"></div>
          </div>

          {/* Blog Grid */}
          {blogLoading ? (
            <div className="flex justify-center py-12">
              <div className="loading-spinner"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {blogPosts.slice(0, 3).map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {/* View All Button */}
          <div className="text-center mt-8">
            <Link
              to="/blog"
              className="inline-flex items-center text-gray-900 border-b-2 border-gray-900 pb-1 font-medium hover:text-amber-600 hover:border-amber-600 transition-colors"
            >
              Xem tất cả bài viết
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-12 lg:py-16 bg-gray-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-4">
            Đăng ký nhận tin
          </h2>
          <p className="text-gray-300 mb-6">
            Nhận thông tin về sản phẩm mới và ưu đãi đặc biệt từ Rare Parfume
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Email của bạn"
              className="flex-1 px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-amber-500 text-gray-900"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors"
            >
              Đăng ký
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
