import { ChartConfig } from 'react-native-chart-kit/dist/HelperTypes'
import { DateRangeKey, DateRange } from '../types'

export const ANALYTICS_CHART_CONFIG: ChartConfig = {
  backgroundColor: '#2A2A30',
  backgroundGradientFrom: '#2A2A30',
  backgroundGradientTo: '#2A2A30',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(58, 155, 255, ${opacity})`, // Blue
  labelColor: (opacity = 1) => `rgba(160, 160, 168, ${opacity})`,
  style: {
    borderRadius: 12,
  },
  propsForBackgroundLines: {
    stroke: '#3A3A42',
    strokeWidth: 1,
  },
  barPercentage: 0.7,
  fillShadowGradient: '#3A9BFF',
  fillShadowGradientOpacity: 1,
}

export const CHART_COLORS = {
  orange: '#FF9500',
  blue: '#3A9BFF',
  green: '#34C759',
  yellow: '#FFD60A',
  red: '#FF453A',
  purple: '#BF5AF2',
}

export const DATE_RANGES: Record<DateRangeKey, DateRange> = {
  '30D': { days: 30, label: '30 Days', start: '', end: '' },
  '3M': { days: 90, label: '3 Months', start: '', end: '' },
  '6M': { days: 180, label: '6 Months', start: '', end: '' },
  'ALL': { days: null, label: 'All Time', start: '', end: '' },
}
