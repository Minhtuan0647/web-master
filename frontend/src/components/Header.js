import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, Menu, X, User, ChevronDown } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const { getTotalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  const sanitizeSearchQuery = (value) => value.replace(/[<>]/g, '').trim();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', isMenuOpen);
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setActiveDropdown(null);
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    const sanitized = sanitizeSearchQuery(searchQuery);
    if (sanitized) {
      navigate(`/products?search=${encodeURIComponent(sanitized)}`);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  // Check if current URL matches a menu item or its submenu
  const isMenuActive = (link) => {
    const currentPath = location.pathname;
    const currentSearch = location.search;
    const fullCurrentUrl = currentPath + currentSearch;

    // For items without submenu, check exact path match
    if (!link.submenu) {
      return currentPath === link.path;
    }

    // For items with submenu, check if any submenu item matches
    return link.submenu.some(subItem => {
      // Check if the current URL matches the submenu path
      if (subItem.path === fullCurrentUrl) return true;
      
      // Check if path and search params match
      const subItemUrl = new URL(subItem.path, window.location.origin);
      if (currentPath !== subItemUrl.pathname) return false;
      
      // Check if the search params from submenu exist in current URL
      const subItemParams = new URLSearchParams(subItemUrl.search);
      const currentParams = new URLSearchParams(currentSearch);
      
      for (const [key, value] of subItemParams) {
        if (currentParams.get(key) !== value) return false;
      }
      return subItemParams.toString() !== '' && currentParams.toString() !== '';
    });
  };

  const navLinks = [
    { 
      name: 'Trang chủ', 
      path: '/',
    },
    { 
      name: 'Nước hoa', 
      path: '/products',
      submenu: [
        { name: 'Tất cả nước hoa', path: '/products' },
        { name: 'Nước hoa nam', path: '/products?gender=male' },
        { name: 'Nước hoa nữ', path: '/products?gender=female' },
        { name: 'Nước hoa Unisex', path: '/products?gender=unisex' },
        { name: 'Nước hoa chiết', path: '/products?product_type=decant' },
      ]
    },
    { 
      name: 'Thương hiệu', 
      path: '/brands',
      submenu: [
        { name: 'Creed', path: '/products?brand=Creed' },
        { name: 'Tom Ford', path: '/products?brand=Tom Ford' },
        { name: 'Parfums de Marly', path: '/products?brand=Parfums de Marly' },
        { name: 'Xerjoff', path: '/products?brand=Xerjoff' },
        { name: 'Xem tất cả', path: '/products' },
      ]
    },
    { 
      name: 'Blog', 
      path: '/blog' 
    },
    { 
      name: 'Liên hệ', 
      path: '/contact' 
    },
  ];

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white shadow-md' 
          : 'bg-white/95 backdrop-blur-sm'
      }`}>
        {/* Top Header */}
        <div className="border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 lg:h-20">
              {/* Left Section - Menu Button (Mobile) */}
              <div className="flex items-center lg:w-1/3">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="lg:hidden p-2 text-gray-700 hover:text-amber-600 transition-colors"
                  aria-expanded={isMenuOpen}
                  aria-label={isMenuOpen ? 'Đóng menu' : 'Mở menu'}
                >
                  {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>

              {/* Center Section - Logo */}
              <div className="flex-1 flex justify-center lg:w-1/3">
                <Link to="/" className="flex flex-col items-center group">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-gray-900 tracking-wide group-hover:text-amber-600 transition-colors">
                    Rare Parfume
                  </span>
                  <span className="text-[10px] sm:text-xs text-gray-500 tracking-[0.2em] uppercase">
                    Niche Perfumery
                  </span>
                </Link>
              </div>

              {/* Right Section - Icons */}
              <div className="flex items-center justify-end space-x-1 sm:space-x-2 lg:w-1/3">
                {/* Search Icon */}
                <div className="relative" ref={searchRef}>
                  <button
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    className="p-2 text-gray-700 hover:text-amber-600 transition-colors"
                    aria-label="Tìm kiếm"
                  >
                    {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                  </button>
                  
                  {/* Search Dropdown */}
                  {isSearchOpen && (
                    <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-xl border border-gray-100 p-4 z-50">
                      <p className="text-sm font-semibold text-gray-900 mb-3">Tìm kiếm</p>
                      <form onSubmit={handleSearch}>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Tìm kiếm sản phẩm..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(sanitizeSearchQuery(e.target.value))}
                            autoComplete="off"
                            autoFocus
                            className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                          />
                          <button
                            type="submit"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors"
                          >
                            <Search className="w-4 h-4" />
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>

                {/* Account Icon */}
                <Link
                  to="/account"
                  className="p-2 text-gray-700 hover:text-amber-600 transition-colors hidden sm:block"
                  aria-label="Tài khoản"
                >
                  <User className="w-5 h-5" />
                </Link>

                {/* Cart Icon */}
                <Link
                  to="/cart"
                  className="relative p-2 text-gray-700 hover:text-amber-600 transition-colors"
                  aria-label="Giỏ hàng"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {getTotalItems() > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-amber-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                      {getTotalItems()}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Menu */}
        <nav className="hidden lg:block border-b border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ul className="flex items-center justify-center space-x-1" ref={dropdownRef}>
              {navLinks.map((link) => {
                const isActive = isMenuActive(link);
                
                return (
                  <li key={link.name} className="relative group">
                    {link.submenu ? (
                      <>
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === link.name ? null : link.name)}
                          className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                            isActive
                              ? 'text-amber-600'
                              : 'text-gray-700 hover:text-amber-600'
                          }`}
                        >
                          {link.name}
                          <ChevronDown className={`ml-1 w-4 h-4 transition-transform ${
                            activeDropdown === link.name ? 'rotate-180' : ''
                          }`} />
                        </button>
                        
                        {/* Dropdown Menu */}
                        <div className={`absolute left-0 top-full mt-0 w-48 bg-white rounded-b-lg shadow-lg border border-t-0 border-gray-100 py-2 transition-all duration-200 ${
                          activeDropdown === link.name ? 'opacity-100 visible' : 'opacity-0 invisible'
                        }`}>
                          {link.submenu.map((subItem) => (
                            <Link
                              key={subItem.name}
                              to={subItem.path}
                              className="block px-4 py-2 text-sm text-gray-700 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      </>
                    ) : (
                      <Link
                        to={link.path}
                        className={`block px-4 py-3 text-sm font-medium transition-colors ${
                          isActive
                            ? 'text-amber-600'
                            : 'text-gray-700 hover:text-amber-600'
                        }`}
                      >
                        {link.name}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Mobile Menu */}
        <div className={`lg:hidden fixed inset-0 top-16 bg-white z-40 transform transition-transform duration-300 ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="h-full overflow-y-auto pb-20">
            {/* Mobile Search */}
            <div className="p-4 border-b border-gray-100">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(sanitizeSearchQuery(e.target.value))}
                    className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-amber-500 text-white rounded-md"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>

            {/* Mobile Navigation Links */}
            <nav className="py-2">
              {navLinks.map((link) => {
                const isActive = isMenuActive(link);
                
                return (
                  <div key={link.name} className="border-b border-gray-50">
                    {link.submenu ? (
                      <div>
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === link.name ? null : link.name)}
                          className={`flex items-center justify-between w-full px-4 py-3 text-base font-medium ${
                            isActive ? 'text-amber-600' : 'text-gray-900'
                          }`}
                        >
                          {link.name}
                          <ChevronDown className={`w-5 h-5 transition-transform ${
                            activeDropdown === link.name ? 'rotate-180' : ''
                          }`} />
                        </button>
                        
                        {activeDropdown === link.name && (
                          <div className="bg-gray-50 py-2">
                            {link.submenu.map((subItem) => (
                              <Link
                                key={subItem.name}
                                to={subItem.path}
                                onClick={() => setIsMenuOpen(false)}
                                className="block px-8 py-2.5 text-sm text-gray-600 hover:text-amber-600"
                              >
                                {subItem.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        to={link.path}
                        onClick={() => setIsMenuOpen(false)}
                        className={`block px-4 py-3 text-base font-medium ${
                          isActive ? 'text-amber-600' : 'text-gray-900 hover:text-amber-600'
                        }`}
                      >
                        {link.name}
                      </Link>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Mobile Contact Info */}
            <div className="p-4 mt-4 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-900 mb-3">Bạn cần hỗ trợ?</p>
              <div className="space-y-2">
                <a href="tel:0931346844" className="flex items-center text-sm text-gray-600 hover:text-amber-600">
                  <span className="mr-2">📞</span>
                  Hotline: 093 134 68 44
                </a>
                <a href="mailto:rareproject.84@gmail.com" className="flex items-center text-sm text-gray-600 hover:text-amber-600">
                  <span className="mr-2">📧</span>
                  rareproject.84@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16 lg:h-[116px]"></div>
    </>
  );
};

export default Header;
