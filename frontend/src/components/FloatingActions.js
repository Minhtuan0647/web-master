import React, { useState } from 'react';
import { Phone, MessageCircle, Mail, MapPin, X } from 'lucide-react';

const FloatingActions = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const actions = [
    {
      name: 'Hotline',
      icon: Phone,
      href: 'tel:0931346844',
      bgColor: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      tooltip: 'Gọi ngay: 093 134 68 44'
    },
    {
      name: 'Zalo',
      icon: () => (
        <svg viewBox="0 0 44 44" className="w-5 h-5" fill="currentColor">
          <path d="M22 0C9.85 0 0 9.85 0 22s9.85 22 22 22 22-9.85 22-22S34.15 0 22 0zm10.64 30.5c-.47.47-1.32.47-1.79 0l-4.6-4.6c-.25-.25-.59-.39-.94-.39H17.5c-.71 0-1.29-.58-1.29-1.29v-1.43c0-.71.58-1.29 1.29-1.29h5.36c.35 0 .69-.14.94-.39l2.81-2.81c.47-.47.47-1.32 0-1.79-.47-.47-1.32-.47-1.79 0l-2.42 2.42H17.5c-2.49 0-4.5 2.01-4.5 4.5v1.43c0 2.49 2.01 4.5 4.5 4.5h5.36l4.99 4.99c.47.47 1.32.47 1.79 0 .47-.47.47-1.32 0-1.79z"/>
        </svg>
      ),
      href: 'https://zalo.me/0931346844',
      bgColor: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      tooltip: 'Chat Zalo: 093 134 68 44',
      external: true
    },
    {
      name: 'Messenger',
      icon: MessageCircle,
      href: 'https://www.facebook.com/profile.php?id=100090307900157',
      bgColor: 'bg-gradient-to-r from-blue-500 to-purple-500',
      hoverColor: 'hover:from-blue-600 hover:to-purple-600',
      tooltip: 'Chat Messenger',
      external: true
    },
    {
      name: 'Email',
      icon: Mail,
      href: 'mailto:rareproject.84@gmail.com',
      bgColor: 'bg-amber-500',
      hoverColor: 'hover:bg-amber-600',
      tooltip: 'Gửi email'
    },
    {
      name: 'Địa chỉ',
      icon: MapPin,
      href: '/contact',
      bgColor: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
      tooltip: 'Xem địa chỉ cửa hàng'
    }
  ];

  return (
    <>
      {/* Desktop Floating Actions - Right Side */}
      <div className="hidden sm:flex fixed right-4 bottom-1/3 flex-col gap-2 z-40">
        {actions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <a
              key={action.name}
              href={action.href}
              target={action.external ? '_blank' : undefined}
              rel={action.external ? 'noopener noreferrer' : undefined}
              className={`group relative w-11 h-11 ${action.bgColor} ${action.hoverColor} rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 hover:scale-110`}
              aria-label={action.name}
            >
              {typeof IconComponent === 'function' ? <IconComponent /> : <IconComponent className="w-5 h-5" />}
              
              {/* Tooltip */}
              <span className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {action.tooltip}
              </span>
            </a>
          );
        })}
      </div>

      {/* Mobile Floating Actions - Bottom Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex items-center justify-around py-2 px-4">
          {actions.slice(0, 5).map((action) => {
            const IconComponent = action.icon;
            return (
              <a
                key={action.name}
                href={action.href}
                target={action.external ? '_blank' : undefined}
                rel={action.external ? 'noopener noreferrer' : undefined}
                className={`w-10 h-10 ${action.bgColor} rounded-full flex items-center justify-center text-white shadow-md`}
                aria-label={action.name}
              >
                {typeof IconComponent === 'function' ? <IconComponent /> : <IconComponent className="w-4 h-4" />}
              </a>
            );
          })}
        </div>
      </div>

      {/* Spacer for mobile bottom bar */}
      <div className="sm:hidden h-16"></div>
    </>
  );
};

export default FloatingActions;

