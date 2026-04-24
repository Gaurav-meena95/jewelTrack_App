import React from 'react';
import { Modal, View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Colors } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import Pressable from './Pressable';

export type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
};

export default function CustomAlert({ visible, title, message, buttons = [], onDismiss }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const iconName = title.toLowerCase().includes('success')
    ? 'checkmark-circle'
    : title.toLowerCase().includes('error') || title.toLowerCase().includes('failed')
    ? 'close-circle'
    : 'information-circle';

  const iconColor = title.toLowerCase().includes('success')
    ? '#2ecc71'
    : title.toLowerCase().includes('error') || title.toLowerCase().includes('failed')
    ? '#e74c3c'
    : theme.brand;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={[styles.box, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: iconColor + '15' }]}>
            <Ionicons name={iconName as any} size={36} color={iconColor} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          {message ? <Text style={[styles.message, { color: theme.text }]}>{message}</Text> : null}
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.btnRow}>
            {buttons.map((btn, i) => (
              <Pressable
                key={i}
                style={[
                  styles.btn,
                  buttons.length > 1 && i < buttons.length - 1 && { borderRightWidth: 1, borderRightColor: theme.border },
                  btn.style === 'destructive' && { backgroundColor: '#e74c3c10' },
                ]}
                onPress={() => { btn.onPress?.(); onDismiss?.(); }}
              >
                <Text style={[
                  styles.btnText,
                  { color: btn.style === 'destructive' ? '#e74c3c' : btn.style === 'cancel' ? theme.text : theme.brand },
                  btn.style === 'cancel' && { opacity: 0.6 },
                ]}>
                  {btn.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  box: { width: '100%', borderRadius: 28, borderWidth: 1, overflow: 'hidden', alignItems: 'center', paddingTop: 30 },
  iconWrap: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 'bold', letterSpacing: 0.3, marginBottom: 8, textAlign: 'center', paddingHorizontal: 20 },
  message: { fontSize: 14, opacity: 0.65, textAlign: 'center', lineHeight: 20, paddingHorizontal: 24, marginBottom: 24 },
  divider: { height: 1, width: '100%' },
  btnRow: { flexDirection: 'row', width: '100%' },
  btn: { flex: 1, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 16, fontWeight: '600' },
});
