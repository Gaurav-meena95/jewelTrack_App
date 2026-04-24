import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, FlatList, useColorScheme } from 'react-native';
import { Colors } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import Pressable from './Pressable';

export type PickerOption = { label: string; value: string };

type Props = {
  options: PickerOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
};

export default function CustomPicker({ options, selectedValue, onValueChange, placeholder = 'Select...' }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [open, setOpen] = useState(false);

  const selected = options.find(o => o.value === selectedValue);

  return (
    <>
      <Pressable
        style={[styles.trigger, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={[styles.triggerText, { color: selected ? theme.text : '#999' }]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={theme.brand} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <Text style={[styles.sheetTitle, { color: theme.text }]}>{placeholder}</Text>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <FlatList
            data={options}
            keyExtractor={item => item.value}
            renderItem={({ item }) => {
              const isSelected = item.value === selectedValue;
              return (
                <Pressable
                  style={[styles.option, isSelected && { backgroundColor: theme.brand + '15' }]}
                  onPress={() => { onValueChange(item.value); setOpen(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, { color: isSelected ? theme.brand : theme.text }]}>
                    {item.label}
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={18} color={theme.brand} />}
                </Pressable>
              );
            }}
            style={{ maxHeight: 360 }}
          />
          <Pressable style={[styles.cancelBtn, { borderTopColor: theme.border }]} onPress={() => setOpen(false)}>
            <Text style={[styles.cancelText, { color: theme.text }]}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 52, borderRadius: 15, borderWidth: 1, paddingHorizontal: 15 },
  triggerText: { fontSize: 14, flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderBottomWidth: 0, paddingBottom: 30 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  sheetTitle: { fontSize: 13, fontWeight: 'bold', letterSpacing: 1, opacity: 0.5, textAlign: 'center', paddingVertical: 12 },
  divider: { height: 1 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16 },
  optionText: { fontSize: 16 },
  cancelBtn: { borderTopWidth: 1, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  cancelText: { fontSize: 16, fontWeight: '600', opacity: 0.6 },
});
