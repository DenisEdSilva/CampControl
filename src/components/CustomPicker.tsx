import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { theme } from '../styles/theme';

type PickerItem = {
    label: string;
    value: any;
};

type CustomPickerProps = {
    label: string;
    items: PickerItem[];
    selectedValue: any;
    onValueChange: (value: any) => void;
    enabled?: boolean;
    placeholder?: string;
};

export default function CustomPicker({ label, items, selectedValue, onValueChange, enabled }: CustomPickerProps) {
    return (
        <View style={styles.container}>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={selectedValue}
                    onValueChange={onValueChange}
                    enabled={enabled}
                    style={styles.picker}
                >
                    <Picker.Item label={label} value={undefined} color="#999" />
                    {items.map((item) => (
                        <Picker.Item key={item.value} label={item.label} value={item.value} />
                    ))}
                </Picker>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  pickerContainer: {
    ...theme.cardStyle,
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  picker: {
    width: '100%',
    color: theme.colors.textPrimary,
  },
});