import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  ScrollView,
  StyleSheet,
  Platform,
  Keyboard, TouchableWithoutFeedback
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import DropDownPicker from "react-native-dropdown-picker";
import { useRouter } from 'expo-router';
import { Inter_500Medium, useFonts } from '@expo-google-fonts/inter';
import { GlobalStyles as GS } from '@/constants/GlobalStyles';
import { useAddExpense } from '@/hooks/crud';
import { useExpenseForm } from '@/hooks/expenseForm';
import { useCurrencyPreference } from '@/hooks/data';
import { useFocusEffect } from "@react-navigation/native";

export default function AddExpenseModal({ visible, onClose }) {
  const router = useRouter();

  // All hooks must be called unconditionally before any early returns.
  const [loaded, error] = useFonts({ Inter_500Medium });
  const add = useAddExpense();
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
    submit: addExpense,
  } = useExpenseForm(add);

  const { data: preferenceCurrency, loading: preferenceCurrencyLoading, refetch: refetchCurrency } = useCurrencyPreference();
  const [openCurrency, setOpenCurrency] = useState(false);

  // Pre-fill the currency field with the user's saved preference once loaded.
  useEffect(() => {
    if (!preferenceCurrencyLoading) {
      setCurrency(preferenceCurrency);
    }
  }, [preferenceCurrencyLoading, preferenceCurrency]);

  // Re-fetch the currency preference each time the screen receives focus.
  useFocusEffect(
    React.useCallback(() => {
      refetchCurrency();
    }, [refetchCurrency])
  );

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Prevent the modal from rendering before the font is available.
  if (!loaded && !error) return null;

  // Show a spinner while expense types or currency types are loading.
  if (load1 || load2) {
    return (
      <View style={styles.spinnerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /** Sync the date picker selection back to the day/month/year form fields. */
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

  const pastelColors = ['#D0E8F2', '#FADADD', '#C1F0DC', '#FFFACD', '#EADCF2', '#FFEDCC'];

  /**
   * Submit the expense, then close the modal and navigate to the full history
   * so the user can immediately see their newly added entry.
   */
  const onAddPress = async () => {
    await addExpense();
    onClose();
    router.replace('/(tabs)/personal_expenses/history');
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.backdrop}>
          <View style={GS.card}>
            <Text style={[GS.title, { color: '#4CAF50', alignSelf: 'center' }]}>
              Add Expense
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>

              {/* Description */}
              <Text style={[GS.footerText, styles.label]}>Description</Text>
              <TextInput
                style={GS.input}
                placeholder="e.g. Gym Membership"
                placeholderTextColor={GS.placeholder}
                value={description}
                onChangeText={setDescription}
              />

              {/* Currency dropdown */}
              <Text style={[GS.footerText, styles.label]}>Currency</Text>
              <DropDownPicker
                open={openCurrency}
                value={currency === null ? 'None': currency}

                items={currency_types.map((c) => ({ label: c, value: c }))}
                setOpen={setOpenCurrency}
                setValue={setCurrency}    

                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                textStyle={styles.dropdownText}
                listItemLabelStyle={styles.dropdownText}

                placeholder="Select"
                searchable
                // zIndex ensures the open dropdown renders above other form fields.
                zIndex={10}
              />

              {/* Amount */}
              <Text style={[GS.footerText, styles.label]}>Amount</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TextInput
                  style={[GS.input, { flex: 1 }]}
                  placeholder="0.00"
                  placeholderTextColor={GS.placeholder}
                  value={amount}
                  keyboardType="decimal-pad"
                  onChangeText={setAmount}
                />
              </View>

              {/* Select a Category */}
              <Text style={[GS.footerText, styles.label]}>Select a Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginVertical: 10 }}
              >
                {expense_types.map((type, i) => {
                  const bgColor =
                    category === type ? pastelColors[i % pastelColors.length] : '#eee';
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

              {/* Date */}
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

              {/* Add Button */}
              <TouchableOpacity onPress={onAddPress} style={styles.addButton}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>

              {/* Back Button */}
              <TouchableOpacity onPress={onClose} style={styles.backButton}>
                <Text style={[styles.backButtonText]}>Back</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({

  // General
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  spinnerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    alignSelf: 'flex-start',
    marginBottom: 4,
    marginTop: 12,
  },

  // Buttons 
  addButton: {
    marginTop: 16,
    marginBottom: 12,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#fff',
  },
  backButton: {
    marginBottom: 24,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#ccc',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#000',
  },

  // Dropdown 
  dropdown: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
  },
  dropdownText: {
    color: '#000',
  },
});
