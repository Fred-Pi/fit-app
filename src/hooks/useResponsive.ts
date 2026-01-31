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
  cardColumns: 1 | 2 | 3 | 4;
  showSidebar: boolean;
  isWide: boolean;
  // Typography scaling
  typographyScale: number;
  spacingScale: number;
  getScaledSize: (baseSize: number) => number;
}

const BREAKPOINTS = {
  mobile: 640,
  tablet: 900,
  desktop: 1200,
  wide: 1600,
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
  const isWide = width >= BREAKPOINTS.wide;
  const contentMaxWidth = isWide ? 1400 : isDesktop ? 1200 : isTablet ? 900 : width;
  const contentPadding = isDesktop ? 32 : isTablet ? 24 : 20;
  const cardColumns: 1 | 2 | 3 | 4 = isWide ? 4 : isDesktop ? 3 : isTablet ? 2 : 1;
  // Show sidebar on tablet+ for web (better desktop/tablet experience)
  const showSidebar = (isDesktop || isTablet) && isWeb;

  // Typography scaling: mobile 1.0x, tablet 1.1x, desktop 1.15x
  const typographyScale = isDesktop ? 1.15 : isTablet ? 1.1 : 1.0;
  const spacingScale = isDesktop ? 1.15 : isTablet ? 1.1 : 1.0;
  const getScaledSize = (baseSize: number) => Math.round(baseSize * typographyScale);

  return {
    isMobile,
    isTablet,
    isDesktop,
    isWeb,
    isWide,
    width,
    height,
    contentMaxWidth,
    contentPadding,
    cardColumns,
    showSidebar,
    typographyScale,
    spacingScale,
    getScaledSize,
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
