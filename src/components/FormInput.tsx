import React from 'react'
import { View, Text, TextInput, TextInputProps, StyleSheet } from 'react-native'
import { colors } from '../utils/theme'

interface FormInputProps extends TextInputProps {
  label?: string
  hint?: string
  required?: boolean
  variant?: 'default' | 'large'
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  hint,
  required,
  variant = 'default',
  style,
  ...textInputProps
}) => {
  const isLarge = variant === 'large'

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}{required && ' *'}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          isLarge && styles.inputLarge,
          style,
        ]}
        placeholderTextColor="#98989D"
        {...textInputProps}
      />
      {hint && <Text style={[styles.hint, isLarge && styles.hintCentered]}>{hint}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#3A3A42',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#2A2A30',
    color: colors.text,
  },
  inputLarge: {
    padding: 16,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  hint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
  },
  hintCentered: {
    textAlign: 'center',
  },
})

export default FormInput
