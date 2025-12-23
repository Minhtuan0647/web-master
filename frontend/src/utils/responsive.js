import React, { useState, useEffect } from 'react';

// Hook để detect screen size
export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    ...screenSize,
    isMobile: screenSize.width < 640,
    isTablet: screenSize.width >= 640 && screenSize.width < 1024,
    isDesktop: screenSize.width >= 1024,
    isLargeDesktop: screenSize.width >= 1280,
    isLandscape: screenSize.width > screenSize.height,
    isPortrait: screenSize.height > screenSize.width,
  };
};

// Component để render responsive content
export const Responsive = ({ 
  mobile, 
  tablet, 
  desktop, 
  children, 
  breakpoint = 'sm' 
}) => {
  const { isMobile, isTablet, isDesktop } = useScreenSize();

  if (isMobile && mobile) {
    return mobile;
  }
  
  if (isTablet && tablet) {
    return tablet;
  }
  
  if (isDesktop && desktop) {
    return desktop;
  }

  return children || null;
};

// Component để hide/show trên các breakpoint khác nhau
export const HideOn = ({ breakpoint, children }) => {
  const { isMobile, isTablet, isDesktop } = useScreenSize();

  switch (breakpoint) {
    case 'mobile':
      return isMobile ? null : children;
    case 'tablet':
      return isTablet ? null : children;
    case 'desktop':
      return isDesktop ? null : children;
    default:
      return children;
  }
};

export const ShowOn = ({ breakpoint, children }) => {
  const { isMobile, isTablet, isDesktop } = useScreenSize();

  switch (breakpoint) {
    case 'mobile':
      return isMobile ? children : null;
    case 'tablet':
      return isTablet ? children : null;
    case 'desktop':
      return isDesktop ? children : null;
    default:
      return children;
  }
};

// Utility functions
export const getResponsiveValue = (values, screenSize) => {
  if (typeof values === 'object') {
    if (screenSize.isMobile && values.mobile !== undefined) {
      return values.mobile;
    }
    if (screenSize.isTablet && values.tablet !== undefined) {
      return values.tablet;
    }
    if (screenSize.isDesktop && values.desktop !== undefined) {
      return values.desktop;
    }
    return values.default || values.desktop || values.tablet || values.mobile;
  }
  return values;
};

// Responsive grid component
export const ResponsiveGrid = ({ 
  children, 
  mobileCols = 1, 
  tabletCols = 2, 
  desktopCols = 3,
  gap = 4,
  className = ''
}) => {
  const { isMobile, isTablet, isDesktop } = useScreenSize();
  
  let cols;
  if (isMobile) cols = mobileCols;
  else if (isTablet) cols = tabletCols;
  else cols = desktopCols;

  return (
    <div 
      className={`grid gap-${gap} ${className}`}
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`
      }}
    >
      {children}
    </div>
  );
};

// Responsive text component
export const ResponsiveText = ({ 
  children, 
  mobileSize = 'base',
  tabletSize = 'lg', 
  desktopSize = 'xl',
  className = ''
}) => {
  const { isMobile, isTablet, isDesktop } = useScreenSize();
  
  let size;
  if (isMobile) size = mobileSize;
  else if (isTablet) size = tabletSize;
  else size = desktopSize;

  return (
    <div className={`text-${size} ${className}`}>
      {children}
    </div>
  );
};

// Responsive spacing component
export const ResponsiveSpacing = ({ 
  children, 
  mobile = 4,
  tablet = 6, 
  desktop = 8,
  direction = 'y',
  className = ''
}) => {
  const { isMobile, isTablet, isDesktop } = useScreenSize();
  
  let spacing;
  if (isMobile) spacing = mobile;
  else if (isTablet) spacing = tablet;
  else spacing = desktop;

  return (
    <div className={`space-${direction}-${spacing} ${className}`}>
      {children}
    </div>
  );
};

export default {
  useScreenSize,
  Responsive,
  HideOn,
  ShowOn,
  getResponsiveValue,
  ResponsiveGrid,
  ResponsiveText,
  ResponsiveSpacing,
};
