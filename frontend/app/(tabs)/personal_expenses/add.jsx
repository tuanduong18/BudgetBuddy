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
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { Inter_500Medium, useFonts } from '@expo-google-fonts/inter';
import { GlobalStyles as GS } from '@/constants/GlobalStyles';
import { useAddExpense } from '@/hooks/crud';
import { useExpenseForm } from '@/hooks/expenseForm';
import { useCurrencyPreference } from '@/hooks/data';
import { useFocusEffect } from "@react-navigation/native";

export default function AddExpenseModal({ visible, onClose }) {
  const router = useRouter();

  // 1) Load Inter font
  const [loaded, error] = useFonts({ Inter_500Medium });

  // 2) Other hooks (always called in same order)
  const add = useAddExpense();
  const {
    category,
    setCategory,
    optional_cat,
    setOptionalCat,
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

  // Reload whenever access this screen
  const { data: preferenceCurrency, loading: preferenceCurrencyLoading, refetch: refetchCurrency } = useCurrencyPreference();
  useFocusEffect(
      React.useCallback(() => {
        refetchCurrency();
      }, [refetchCurrency])
    );

  useEffect(()=>{
    if(!preferenceCurrencyLoading) {
      setCurrency(preferenceCurrency)
    }
  },[preferenceCurrencyLoading, preferenceCurrency])

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 3) Early return if font not loaded
  if (!loaded && !error) {
    return null;
  }
  // 4) Early return if form data still loading
  if (load1 || load2) {
    return (
      <View style={styles.spinnerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 5) Handle date selection on native
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

  // 6) Pastel colors for category pills
  const pastelColors = ['#D0E8F2', '#FADADD', '#C1F0DC', '#FFFACD', '#EADCF2', '#FFEDCC'];

  // 7) For Add button to close the modal
  const onAddPress = async () => {
    await addExpense();     // wait for submit to complete
    onClose();              // close modal after success
    router.replace('/(tabs)/personal_expenses/history')
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
                value={description}
                onChangeText={setDescription}
              />

              {/* Currency */}
              <Text style={[GS.footerText, styles.label]}>Currency</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={currency}
                  onValueChange={setCurrency}
                  mode="dropdown"
                  style={styles.picker}
                  dropdownIconColor="#666"
                >
                  {currency_types.map((c) => (
                    <Picker.Item key={c} label={c} value={c} />
                  ))}
                </Picker>
                {Platform.OS === 'web' && (
                  <View style={styles.webArrow}>
                    <Text style={{ color: '#666', fontSize: 12 }}>▼</Text>
                  </View>
                )}
              </View>

              {/* Amount */}
              <Text style={[GS.footerText, styles.label]}>Amount</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TextInput
                  style={[GS.input, { flex: 1 }]}
                  placeholder="0.00"
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

  // ── Picker Wrapper ───────────────────────────────────────────────────────────
  pickerWrapper: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#000',
    backgroundColor: '#f5f5f5',
    ...Platform.select({
      web: {
        borderWidth: 0,
        appearance: 'none',
        WebkitAppearance: 'none',
        paddingHorizontal: 12,
      },
      ios: {},
      android: {},
    }),
  },
  webArrow: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    pointerEvents: 'none',
  },

  // ── Buttons ─────────────────────────────────────────────────────────────────────
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
});
