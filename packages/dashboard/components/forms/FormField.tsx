import React from 'react'
import { Label, Text, YStack } from 'tamagui'

type Props = {
  id: string
  label: string
  children: React.ReactNode
  helperText?: string
  errorText?: string
}

export default function FormField({
  id,
  label,
  helperText = '',
  errorText = '',
  children,
}: Props) {
  return (
    <>
      <Label fontWeight="bold" htmlFor={id}>
        {label}
      </Label>
      {children}
      <YStack marginTop="$2">
        {errorText && (
          <Text fontSize="$3" color="$red11">
            {errorText}
          </Text>
        )}
        <Text fontSize="$2" color="$gray10">
          {helperText}
        </Text>
      </YStack>
    </>
  )
}
