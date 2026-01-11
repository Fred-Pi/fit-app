import { ChartConfig } from 'react-native-chart-kit/dist/HelperTypes'
import { DateRangeKey, DateRange } from '../types'
import { colors } from './theme'

export const ANALYTICS_CHART_CONFIG: ChartConfig = {
  backgroundColor: 'transparent',
  backgroundGradientFrom: colors.surface,
  backgroundGradientTo: colors.surface,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // colors.primary
  labelColor: (opacity = 1) => `rgba(161, 161, 170, ${opacity})`, // colors.textSecondary
  style: {
    borderRadius: 12,
  },
  propsForBackgroundLines: {
    stroke: colors.borderLight,
    strokeWidth: 1,
  },
  barPercentage: 0.7,
  fillShadowGradient: colors.primary,
  fillShadowGradientOpacity: 1,
}

export const CHART_COLORS = {
  orange: colors.warning,
  blue: colors.primary,
  green: colors.success,
  yellow: '#FFD60A',
  red: colors.error,
  purple: colors.analytics,
}

export const DATE_RANGES: Record<DateRangeKey, DateRange> = {
  '30D': { days: 30, label: '30 Days', start: '', end: '' },
  '3M': { days: 90, label: '3 Months', start: '', end: '' },
  '6M': { days: 180, label: '6 Months', start: '', end: '' },
  'ALL': { days: null, label: 'All Time', start: '', end: '' },
}
