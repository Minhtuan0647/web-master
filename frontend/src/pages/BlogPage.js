import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { Calendar, User, ArrowRight } from 'lucide-react';
import BlogCard from '../components/BlogCard';
import { fetchBlogPosts } from '../services/api';

const BlogPage = () => {
  const { data: blogPosts = [], isLoading } = useQuery(
    'blog-posts',
    fetchBlogPosts,
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog & Tin tức</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Khám phá thế giới nước hoa qua những bài viết chuyên sâu và cập nhật xu hướng mới nhất
            </p>
          </motion.div>
        </div>

        {/* Featured Post */}
        {blogPosts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-16"
          >
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="aspect-video lg:aspect-square">
                  <img
                    src={blogPosts[0].featured_image || '/images/blog-placeholder.jpg'}
                    alt={blogPosts[0].title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <div className="mb-4">
                    <span className="inline-flex items-center space-x-2 bg-amber-100 rounded-full px-3 py-1 text-sm font-medium text-amber-800">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(blogPosts[0].published_at || blogPosts[0].created_at)}</span>
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    {blogPosts[0].title}
                  </h2>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {blogPosts[0].excerpt || blogPosts[0].content?.substring(0, 200) + '...'}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <User className="w-4 h-4" />
                      <span>{blogPosts[0].author}</span>
                    </div>
                    <Link
                      to={`/blog/${blogPosts[0].slug}`}
                      className="inline-flex items-center space-x-2 text-amber-600 hover:text-amber-700 font-medium"
                    >
                      <span>Đọc thêm</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Blog Posts Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {blogPosts.slice(1).map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <BlogCard post={post} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Newsletter Subscription */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-20 bg-gradient-to-r from-amber-600 to-amber-800 rounded-2xl p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-4">
            Đăng ký nhận tin tức
          </h2>
          <p className="text-amber-100 mb-6 max-w-2xl mx-auto">
            Nhận những bài viết mới nhất về nước hoa và xu hướng thời trang ngay trong hộp thư của bạn
          </p>
          <div className="max-w-md mx-auto flex space-x-4">
            <input
              type="email"
              placeholder="Nhập email của bạn"
              className="flex-1 px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-amber-300 focus:outline-none"
            />
            <button className="bg-white text-amber-600 hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg transition-colors duration-300">
              Đăng ký
            </button>
          </div>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-16"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Chủ đề phổ biến</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              'Hướng dẫn chọn nước hoa',
              'Xu hướng nước hoa 2024',
              'Cách sử dụng nước hoa',
              'Lịch sử nước hoa',
              'Nước hoa nam',
              'Nước hoa nữ',
              'Nước hoa unisex',
              'Chăm sóc nước hoa'
            ].map((category, index) => (
              <motion.button
                key={category}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + index * 0.05 }}
                className="px-4 py-2 bg-white border border-gray-300 rounded-full text-gray-700 hover:border-amber-500 hover:text-amber-600 transition-colors duration-300"
              >
                {category}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BlogPage;
