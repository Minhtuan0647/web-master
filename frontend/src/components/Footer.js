import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, Phone, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const quickLinks = [
    { name: 'Sản phẩm khuyến mãi', path: '/products?sale=true' },
    { name: 'Sản phẩm mới', path: '/products?sort=newest' },
    { name: 'Sản phẩm bán chạy', path: '/products?sort=bestseller' },
    { name: 'Tất cả sản phẩm', path: '/products' },
  ];

  const supportLinks = [
    { name: 'Giới thiệu', path: '/about' },
    { name: 'Hướng dẫn mua hàng', path: '/shopping-guide' },
    { name: 'Chính sách đổi trả', path: '/return-policy' },
    { name: 'Chính sách bảo mật', path: '/privacy' },
    { name: 'Liên hệ', path: '/contact' },
  ];

  return (
    <footer className="bg-white border-t border-gray-200">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: About */}
          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-4">Giới thiệu</h4>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Rare Parfume là nơi hội tụ những người yêu nước hoa, mua bán, trao đổi 
              và thích sưu tầm nước hoa niche cao cấp.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-3">
              <a
                href="https://www.facebook.com/profile.php?id=100090307900157"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-amber-500 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com/rare.parfum"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-amber-500 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Contact Info */}
          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-4">Thông tin liên hệ</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                <span>136/4 Trần Quang Diệu, Phường 14, Quận 3, Thành phố Hồ Chí Minh, Việt Nam</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0 text-amber-500" />
                <a href="tel:0931346844" className="hover:text-amber-600">
                  Hotline: 093 134 68 44
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0 text-amber-500" />
                <a href="mailto:rareproject.84@gmail.com" className="hover:text-amber-600">
                  rareproject.84@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div>
            {/* Desktop */}
            <div className="hidden lg:block">
              <h4 className="text-base font-semibold text-gray-900 mb-4">Liên kết</h4>
              <ul className="space-y-2 text-sm">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="text-gray-600 hover:text-amber-600 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mobile Accordion */}
            <div className="lg:hidden border-t border-gray-200 pt-4 -mx-4 px-4">
              <button
                onClick={() => toggleSection('links')}
                className="flex items-center justify-between w-full py-2 text-left"
              >
                <span className="text-base font-semibold text-gray-900">Liên kết</span>
                {expandedSection === 'links' ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {expandedSection === 'links' && (
                <ul className="space-y-2 text-sm pb-4">
                  {quickLinks.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.path}
                        className="text-gray-600 hover:text-amber-600 transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Column 4: Support */}
          <div>
            {/* Desktop */}
            <div className="hidden lg:block">
              <h4 className="text-base font-semibold text-gray-900 mb-4">Hỗ trợ</h4>
              <ul className="space-y-2 text-sm">
                {supportLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="text-gray-600 hover:text-amber-600 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mobile Accordion */}
            <div className="lg:hidden border-t border-gray-200 pt-4 -mx-4 px-4">
              <button
                onClick={() => toggleSection('support')}
                className="flex items-center justify-between w-full py-2 text-left"
              >
                <span className="text-base font-semibold text-gray-900">Hỗ trợ</span>
                {expandedSection === 'support' ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {expandedSection === 'support' && (
                <ul className="space-y-2 text-sm pb-4">
                  {supportLinks.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.path}
                        className="text-gray-600 hover:text-amber-600 transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
            <p>© {currentYear} Rare Parfume. Tất cả quyền được bảo lưu.</p>
            <div className="flex space-x-4 mt-2 sm:mt-0">
              <Link to="/terms" className="hover:text-amber-600 transition-colors">
                Điều khoản
              </Link>
              <Link to="/privacy" className="hover:text-amber-600 transition-colors">
                Bảo mật
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
