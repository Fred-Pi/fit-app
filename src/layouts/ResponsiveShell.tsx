/**
 * ResponsiveShell
 *
 * The core layout switcher for v0.2.0 responsive design.
 *
 * - Mobile/Tablet: Bottom tab navigation (existing pattern)
 * - Desktop Web: Sidebar navigation with multi-column content
 *
 * This component reads viewport size and platform to determine
 * which layout to render. Both layouts share the same data layer
 * and global modals.
 */

import React from 'react';
import { useResponsive } from '../hooks/useResponsive';
import MobileLayout from './MobileLayout';
import DesktopLayout from './DesktopLayout';

const ResponsiveShell: React.FC = () => {
  const { showSidebar } = useResponsive();

  // Desktop web gets sidebar layout
  // Everything else gets bottom tabs
  if (showSidebar) {
    return <DesktopLayout />;
  }

  return <MobileLayout />;
};

export default ResponsiveShell;
