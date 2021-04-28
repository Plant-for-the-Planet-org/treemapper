import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

interface StepProps {
  index: number;
  fields: any;
}

export default function Step({ index, fields }: StepProps) {
  return (
    <View>
      <Text>Step {index}</Text>
      {fields.map((field: any) => (
        <Text>field</Text>
      ))}
    </View>
  );
}
