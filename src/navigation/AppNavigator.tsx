/**
 * AppNavigator
 *
 * Entry point for authenticated app navigation.
 * Uses ResponsiveShell to switch between mobile (bottom tabs)
 * and desktop (sidebar) layouts based on viewport.
 */

import React from 'react';
import { ResponsiveShell } from '../layouts';

// Re-export types for backward compatibility
export type { MobileTabParamList as RootTabParamList } from '../layouts/MobileLayout';

const AppNavigator: React.FC = () => {
  return <ResponsiveShell />;
};

export default AppNavigator;
