import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight } from 'lucide-react';

const BlogCard = ({ post }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="group">
      <Link to={`/blog/${post.slug}`} className="block">
        {/* Blog Image */}
        <div className="relative aspect-video overflow-hidden bg-gray-100 mb-4">
          <img
            src={post.featured_image || '/images/blog-placeholder.jpg'}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>

        {/* Blog Content */}
        <div className="space-y-2">
          {/* Meta Info */}
          <div className="flex items-center text-xs text-gray-500 space-x-3">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(post.published_at || post.created_at)}</span>
            </div>
            {post.author && (
              <div className="flex items-center space-x-1">
                <User className="w-3.5 h-3.5" />
                <span>{post.author}</span>
              </div>
            )}
          </div>
          
          {/* Title */}
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-amber-600 transition-colors">
            {post.title}
          </h3>
          
          {/* Excerpt */}
          <p className="text-sm text-gray-600 line-clamp-2">
            {post.excerpt || post.content?.substring(0, 120) + '...'}
          </p>

          {/* Read More */}
          <div className="flex items-center text-sm text-amber-600 font-medium pt-1">
            <span>Đọc thêm</span>
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>
      </Link>
    </div>
  );
};

export default BlogCard;
