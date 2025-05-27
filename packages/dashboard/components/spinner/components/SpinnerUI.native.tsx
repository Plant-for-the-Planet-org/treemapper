import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MoveLeft } from 'lucide-react-native';

interface BackUIProps {
  label: string;
  navigateBack: () => void;
}

export function BackButton({ label, navigateBack }: BackUIProps) {
  return (
    <TouchableOpacity onPress={navigateBack} style={styles.container}>
      <MoveLeft size={20} color="#262626" />
      <Text style={styles.label}>{label || 'Go Back'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginLeft: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    color: '#262626',
    fontSize: 18,
    marginLeft: 10,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
});

export default BackButton;