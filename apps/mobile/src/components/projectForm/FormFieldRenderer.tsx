import { StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native'
import React, { useState } from 'react'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Colors, Typography } from 'src/utils/constants'
import OutlinedTextInput from 'src/components/common/OutlinedTextInput'
import CustomDropdownComponent from 'src/components/common/CustomDropDown'
import Switch from 'src/components/common/Switch'
import { FieldOption, FormField } from 'src/types/interface/projectForm.interface'
import { DropdownData } from 'src/types/interface/app.interface'

interface Props {
  field: FormField
  value: string
  onChange: (fieldId: string, value: string) => void
  error?: string
  editable?: boolean
}

// Renders a single server-driven form field with the matching input. Values
// are always kept as strings (stored as dataType:'string' metadata).
const FormFieldRenderer = (props: Props) => {
  const { field, value, onChange, error = '', editable = true } = props
  const options: FieldOption[] = field.config?.options || []

  const renderLabel = () => (
    <View style={styles.labelRow}>
      <Text style={styles.label}>{field.label}</Text>
      {field.required && <Text style={styles.required}> *</Text>}
    </View>
  )

  const renderHelp = () =>
    field.helpText ? <Text style={styles.help}>{field.helpText}</Text> : null

  const renderError = () =>
    error ? <Text style={styles.error}>{error}</Text> : null

  switch (field.type) {
    case 'text':
    case 'number': {
      return (
        <View style={styles.container}>
          <OutlinedTextInput
            placeholder={field.placeholder || field.label}
            changeHandler={(v) => onChange(field.id, v)}
            keyboardType={field.type === 'number' ? 'numeric' : 'default'}
            trailingText={field.config?.unit || ''}
            errMsg={error}
            defaultValue={value}
            info={field.helpText || undefined}
          />
        </View>
      )
    }

    case 'dropdown': {
      const data: DropdownData[] = options.map((o, i) => ({
        label: o.label,
        value: o.value,
        index: i,
      }))
      const selected: DropdownData =
        data.find((d) => d.value === value) || { label: '', value: '' }
      return (
        <View style={styles.container}>
          <CustomDropdownComponent
            label={field.label}
            data={data}
            selectedValue={selected}
            onSelect={(item) => onChange(field.id, item.value)}
          />
          {renderHelp()}
          {renderError()}
        </View>
      )
    }

    case 'checkbox': {
      // A boolean checkbox when there are no options; a multi-select list when
      // options are defined. Multi-select stores a comma-joined value string.
      if (options.length === 0) {
        const checked = value === 'true'
        return (
          <View style={styles.container}>
            <View style={styles.switchRow}>
              {renderLabel()}
              <Switch
                value={checked}
                disabled={!editable}
                onValueChange={() => onChange(field.id, checked ? 'false' : 'true')}
              />
            </View>
            {renderHelp()}
            {renderError()}
          </View>
        )
      }
      const selectedValues = value ? value.split(',').filter(Boolean) : []
      const toggle = (val: string) => {
        const next = selectedValues.includes(val)
          ? selectedValues.filter((v) => v !== val)
          : [...selectedValues, val]
        onChange(field.id, next.join(','))
      }
      return (
        <View style={styles.container}>
          {renderLabel()}
          {options.map((o) => {
            const on = selectedValues.includes(o.value)
            return (
              <TouchableOpacity
                key={o.id}
                style={styles.optionRow}
                disabled={!editable}
                onPress={() => toggle(o.value)}
              >
                <View style={[styles.checkBox, on && styles.checkBoxOn]}>
                  {on && <View style={styles.checkBoxInner} />}
                </View>
                <Text style={styles.optionLabel}>{o.label}</Text>
              </TouchableOpacity>
            )
          })}
          {renderHelp()}
          {renderError()}
        </View>
      )
    }

    case 'radio': {
      return (
        <View style={styles.container}>
          {renderLabel()}
          {options.map((o) => {
            const on = value === o.value
            return (
              <TouchableOpacity
                key={o.id}
                style={styles.optionRow}
                disabled={!editable}
                onPress={() => onChange(field.id, o.value)}
              >
                <View style={[styles.radio, on && styles.radioOn]}>
                  {on && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.optionLabel}>{o.label}</Text>
              </TouchableOpacity>
            )
          })}
          {renderHelp()}
          {renderError()}
        </View>
      )
    }

    case 'date': {
      return (
        <DateField
          field={field}
          value={value}
          editable={editable}
          onChange={onChange}
          renderLabel={renderLabel}
          renderHelp={renderHelp}
          renderError={renderError}
        />
      )
    }

    default:
      return null
  }
}

interface DateFieldProps {
  field: FormField
  value: string
  editable: boolean
  onChange: (fieldId: string, value: string) => void
  renderLabel: () => React.ReactNode
  renderHelp: () => React.ReactNode
  renderError: () => React.ReactNode
}

// Value stored as an ISO date string (YYYY-MM-DD) for stable serialization.
const DateField = (props: DateFieldProps) => {
  const { field, value, editable, onChange, renderLabel, renderHelp, renderError } = props
  const [show, setShow] = useState(false)
  const current = value ? new Date(value) : new Date()
  const display = value ? new Date(value).toLocaleDateString() : 'Select date'

  const handleChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') setShow(false)
    if (event?.type === 'dismissed') return
    if (date) onChange(field.id, date.toISOString().slice(0, 10))
  }

  return (
    <View style={styles.container}>
      {renderLabel()}
      <TouchableOpacity
        style={styles.dateInput}
        disabled={!editable}
        onPress={() => setShow(true)}
      >
        <Text style={[styles.dateText, !value && styles.datePlaceholder]}>{display}</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={current}
          mode="date"
          display={Platform.OS === 'android' ? 'default' : 'spinner'}
          onChange={handleChange}
        />
      )}
      {renderHelp()}
      {renderError()}
    </View>
  )
}

export default FormFieldRenderer

const styles = StyleSheet.create({
  container: {
    width: '90%',
    alignSelf: 'center',
    marginVertical: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
  },
  required: {
    color: Colors.ALERT,
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
  },
  help: {
    fontSize: 13,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_LIGHT,
    marginTop: 4,
  },
  error: {
    fontSize: 13,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.ALERT,
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  optionLabel: {
    fontSize: 15,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_COLOR,
    marginLeft: 12,
    flex: 1,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.GRAY_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    borderColor: Colors.NEW_PRIMARY,
  },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: Colors.NEW_PRIMARY,
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.GRAY_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxOn: {
    borderColor: Colors.NEW_PRIMARY,
    backgroundColor: Colors.NEW_PRIMARY,
  },
  checkBoxInner: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: Colors.WHITE,
  },
  dateInput: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.GRAY_BORDER,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  dateText: {
    fontSize: 16,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.DARK_TEXT_COLOR,
  },
  datePlaceholder: {
    color: Colors.GRAY_BORDER,
  },
})
