import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useUpdateExpense, useDeleteExpense } from '@/hooks/crud';
import { useExpenseForm } from '@/hooks/expenseForm';
import { Inter_500Medium, useFonts } from '@expo-google-fonts/inter';
import { GlobalStyles as GS } from '@/constants/GlobalStyles';

export default function UpdateExpense() {
  // hooks
  const { id } = useLocalSearchParams();
  const update = useUpdateExpense();
  const remove = useDeleteExpense();
  const router = useRouter();

  // load fonts
  const [loaded, error] = useFonts({ Inter_500Medium });

  // form state and loading
  const {
    category,
    setCategory,
    amount,
    setAmount,
    currency,
    setCurrency,
    description,
    setDescription,
    day,
    setDay,
    month,
    setMonth,
    year,
    setYear,
    expense_types,
    currency_types,
    load1,
    load2,
    submit: updateExpense,
  } = useExpenseForm(update, id);

  // Date picker native state (must be declared here, before any return)
  const [date, setDate] = useState(() => {
    // initialize from existing day/month/year, or fallback to today
    if (day && month && year) {
      return new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10)
      );
    }
    return new Date();
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // local state for the field 
  const [openCurrency, setOpenCurrency] = useState(false);

  // Early returns (now safe, because hooks are already called) 
  if (!loaded && !error) {
    return null; // font not ready
  }
  if (load1 || load2) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  // Handlers 
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      const d = selectedDate.getDate().toString().padStart(2, '0');
      const m = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const y = selectedDate.getFullYear().toString();
      setDay(d);
      setMonth(m);
      setYear(y);
    }
  };

  const onDelete = () => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
            const ok = await remove({ id });
            router.replace('/(tabs)/personal_expenses/history');
        }
      }
    ]);
  };

  const onSave = async () => {
    await updateExpense();
    router.replace('/(tabs)/personal_expenses/history');
  };

  const onCancel = () => {
    router.replace('/(tabs)/personal_expenses/history');
  };

  // Pastel colors for category pills
  const pastelColors = ['#D0E8F2', '#FADADD', '#C1F0DC', '#FFFACD', '#EADCF2', '#FFEDCC'];

  return (
    <ScrollView contentContainerStyle={[GS.card, { paddingTop: 70, backgroundColor: '#fff' }]}>
      <Text style={GS.title}>Update Expense</Text>

      {/* Description */}
      <Text style={[GS.footerText, styles.label]}>Description</Text>
      <TextInput
        style={GS.input}
        placeholder="e.g. Gym Membership"
        placeholderTextColor={GS.placeholder}
        value={description}
        onChangeText={setDescription}
      />

      {/* Currency */}
      <Text style={[GS.footerText, styles.label]}>Currency</Text>
        <DropDownPicker
                open={openCurrency}
                value={currency}

                items={currency_types.map((c) => ({ label: c, value: c }))}
                setOpen={setOpenCurrency}
                setValue={setCurrency}    

                /* ---- fixed light palette ---- */
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                textStyle={styles.dropdownText}
                listItemLabelStyle={styles.dropdownText}

                listMode="MODAL"
                modalTitle="Select currency"
                closeOnBackPressed

                placeholder="Select"
                searchable
                zIndex={10}        /* avoids overlap inside ScrollViews / modals */
        />

      {/* Amount */}
      <Text style={[GS.footerText, styles.label]}>Amount</Text>
      <TextInput
        style={GS.input}
        placeholder="0.00"
        value={amount}
        keyboardType="decimal-pad"
        onChangeText={setAmount}
      />

      {/* Select a Category (now between Amount and Date) */}
      <Text style={[GS.footerText, styles.label]}>Select a Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 5 }}>
        {expense_types.map((type, i) => {
          const bgColor = category === type ? pastelColors[i % pastelColors.length] : '#eee';
          return (
            <TouchableOpacity
              key={type}
              onPress={() => setCategory(type)}
              style={{
                backgroundColor: bgColor,
                paddingVertical: 6,
                paddingHorizontal: 14,
                borderRadius: 20,
                marginRight: 8,
              }}
            >
              <Text>{type}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Date (single field, same style as Add modal) */}
      <Text style={[GS.footerText, styles.label]}>Date</Text>
      {Platform.OS === 'web' ? (
        <TextInput
          style={GS.input}
          placeholder="DD/MM/YYYY"
          value={`${day}/${month}/${year}`}
          onChangeText={(text) => {
            const parts = text.split('/');
            if (parts.length === 3) {
              setDay(parts[0].padStart(2, '0'));
              setMonth(parts[1].padStart(2, '0'));
              setYear(parts[2]);
            }
          }}
        />
      ) : (
        <>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[GS.input, { justifyContent: 'center' }]}
          >
            <Text>{`${day}/${month}/${year}`}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}
        </>
      )}

      {/* Save Button (navigates back after saving) */}
      <TouchableOpacity onPress={onSave} style={GS.button}>
        <Text style={GS.buttonText}>Save</Text>
      </TouchableOpacity>

      {/* Delete Button */}
      <TouchableOpacity onPress={onDelete} style={[GS.button, { backgroundColor: '#f88' }]}>
        <Text style={[GS.buttonText, { color: '#fff' }]}>Delete</Text>
      </TouchableOpacity>

      {/* Cancel Button */}
      <TouchableOpacity onPress={onCancel} style={[GS.button, { backgroundColor: '#ddd' }]}>
        <Text style={[GS.buttonText, { color: '#000' }]}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Dropdown 
  dropdown: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    marginBottom: 14,
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
  },
  dropdownText: {
    color: '#000',
  },
  label: {
    alignSelf: 'flex-start',
    marginBottom: 6,
    marginTop: 6,
  },
});
