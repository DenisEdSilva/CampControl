import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

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
            <Text style={styles.label}>{label}</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={selectedValue}
                    onValueChange={onValueChange}
                    enabled={enabled}
                    style={styles.picker}
                >
                    <Picker.Item label="Selecione uma opção..." value={undefined} color="#999" />
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
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#333',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
  },
  picker: {
    height: 50,
    width: '100%',
  },
});