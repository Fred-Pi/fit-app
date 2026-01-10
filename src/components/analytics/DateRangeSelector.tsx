import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { colors } from '../../utils/theme'
import { DateRangeKey } from '../../types'
import { DATE_RANGES } from '../../utils/analyticsChartConfig'

interface DateRangeSelectorProps {
  selectedRange: DateRangeKey
  onRangeChange: (range: DateRangeKey) => void
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  selectedRange,
  onRangeChange
}) => {
  const ranges: DateRangeKey[] = ['30D', '3M', '6M', 'ALL']

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {ranges.map(range => {
        const isSelected = selectedRange === range
        return (
          <TouchableOpacity
            key={range}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onRangeChange(range)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {DATE_RANGES[range].label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
    borderWidth: 1.5,
    borderColor: '#3A3A42',
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.text,
  },
})

export default DateRangeSelector
