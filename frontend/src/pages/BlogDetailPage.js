import React from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { Calendar, User, ArrowLeft, Share2, Heart } from 'lucide-react';
import { fetchBlogPost } from '../services/api';

const BlogDetailPage = () => {
  const { slug } = useParams();
  const { data: post, isLoading, error } = useQuery(
    ['blog-post', slug],
    () => fetchBlogPost(slug),
    {
      enabled: !!slug,
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Bài viết không tồn tại</h2>
          <p className="text-gray-600">Bài viết bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <a
            href="/blog"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-amber-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại blog</span>
          </a>
        </motion.div>

        {/* Article Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <div className="mb-6">
            <span className="inline-flex items-center space-x-2 bg-amber-100 rounded-full px-4 py-2 text-sm font-medium text-amber-800">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(post.published_at || post.created_at)}</span>
            </span>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>
          
          <div className="flex items-center justify-center space-x-6 text-gray-600">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-1 hover:text-red-500 transition-colors duration-300">
                <Heart className="w-5 h-5" />
                <span>24</span>
              </button>
              <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors duration-300">
                <Share2 className="w-5 h-5" />
                <span>Chia sẻ</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Featured Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <div className="aspect-video rounded-2xl overflow-hidden shadow-xl">
            <img
              src={post.featured_image || '/images/blog-placeholder.jpg'}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        </motion.div>

        {/* Article Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-8 lg:p-12"
        >
          <div className="prose prose-lg max-w-none">
            <div className="text-gray-600 leading-relaxed whitespace-pre-line">
              {post.content || post.excerpt}
            </div>
          </div>

          {/* Article Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{post.author}</p>
                  <p className="text-sm text-gray-600">Tác giả</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-300">
                  <Heart className="w-4 h-4" />
                  <span>Thích</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-300">
                  <Share2 className="w-4 h-4" />
                  <span>Chia sẻ</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Related Articles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-16"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Bài viết liên quan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Placeholder for related articles */}
            {[1, 2, 3].map((index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="aspect-video bg-gray-200"></div>
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Bài viết liên quan {index}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Mô tả ngắn về bài viết liên quan...
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{post.author}</span>
                    <span>{formatDate(post.published_at || post.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Newsletter Subscription */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-16 bg-gradient-to-r from-amber-600 to-amber-800 rounded-2xl p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-4">
            Thích bài viết này?
          </h2>
          <p className="text-amber-100 mb-6 max-w-2xl mx-auto">
            Đăng ký nhận những bài viết mới nhất về nước hoa và xu hướng thời trang
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
      </div>
    </div>
  );
};

export default BlogDetailPage;
