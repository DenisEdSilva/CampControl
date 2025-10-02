/* eslint-disable react/no-unstable-nested-components */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import Icon from 'react-native-vector-icons/Feather';

type PickerItem = {
    label: string;
    value: any;
};

type CustomPickerProps = {
    label: string;
    items: PickerItem[];
    selectedValue: any;
    onValueChange: (value: any) => void;
    placeholder?: string;
};

export default function CustomPicker({ label, items, selectedValue, onValueChange, placeholder }: CustomPickerProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <View>
                <RNPickerSelect
                  onValueChange={onValueChange}
                  items={items}
                  value={selectedValue}
                  placeholder={{ label: placeholder || 'Selecione uma opção...', value: null }}
                  style={pickerSelectStyles}
                  useNativeAndroidPickerStyle={false} 
                  Icon={() => {
                    return <Icon name="chevron-down" size={24} color="gray" />;
                  }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#333',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderColor: '#aaaaaf',
    borderWidth: 1,
    borderRadius: 8,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderColor: '#f85f17ff',
    borderWidth: 1,
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderColor: '#f85f17ff',
    borderWidth: 1,
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
  },
  iconContainer: {
    top: 10,
    right: 15,
  },
  placeholder: {
    color: '#a0a0a0',
  }
});