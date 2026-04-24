import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

export default function Pressable({ activeOpacity = 1, children, ...props }: TouchableOpacityProps) {
  return (
    <TouchableOpacity activeOpacity={activeOpacity} {...props}>
      {children}
    </TouchableOpacity>
  );
}
