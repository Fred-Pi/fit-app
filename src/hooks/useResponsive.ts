import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

export interface ResponsiveBreakpoints {
  isMobile: boolean;      // < 640px
  isTablet: boolean;      // 640px - 1024px
  isDesktop: boolean;     // > 1024px
  isWeb: boolean;
  width: number;
  height: number;
}

export interface ResponsiveLayout {
  contentMaxWidth: number;
  contentPadding: number;
  cardColumns: 1 | 2 | 3;
  showSidebar: boolean;
}

const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
  desktop: 1280,
};

export function useResponsive(): ResponsiveBreakpoints & ResponsiveLayout {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription.remove();
  }, []);

  const { width, height } = dimensions;
  const isWeb = Platform.OS === 'web';

  const isMobile = width < BREAKPOINTS.mobile;
  const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
  const isDesktop = width >= BREAKPOINTS.tablet;

  // Layout calculations
  const contentMaxWidth = isDesktop ? 1200 : isTablet ? 900 : width;
  const contentPadding = isDesktop ? 32 : isTablet ? 24 : 20;
  const cardColumns = isDesktop ? 3 : isTablet ? 2 : 1;
  const showSidebar = isDesktop && isWeb;

  return {
    isMobile,
    isTablet,
    isDesktop,
    isWeb,
    width,
    height,
    contentMaxWidth,
    contentPadding,
    cardColumns,
    showSidebar,
  };
}

/**
 * Get responsive styles based on breakpoints
 */
export function getResponsiveValue<T>(
  width: number,
  options: { mobile: T; tablet?: T; desktop?: T }
): T {
  if (width >= BREAKPOINTS.tablet && options.desktop !== undefined) {
    return options.desktop;
  }
  if (width >= BREAKPOINTS.mobile && options.tablet !== undefined) {
    return options.tablet;
  }
  return options.mobile;
}
