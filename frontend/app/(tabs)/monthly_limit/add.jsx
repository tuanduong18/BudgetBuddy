import React, { useEffect, useState } from 'react';
import { Keyboard, TouchableWithoutFeedback, Modal, ActivityIndicator, TextInput, View, Text, Alert, TouchableOpacity, StyleSheet, } from 'react-native';
import { useRouter } from 'expo-router';
import DropDownPicker from "react-native-dropdown-picker";
import { Inter_500Medium, useFonts } from "@expo-google-fonts/inter";
import { useAddLimit } from "@/hooks/crud";
import { useMonthlyLimitForm } from "@/hooks/monthlyLimitForm";
import { useCurrencyPreference } from '@/hooks/data';
import { useFocusEffect } from "@react-navigation/native";
import { GlobalStyles as GS } from '@/constants/GlobalStyles';



export default function AddLimit({ visible, onClose }) {  
    const router = useRouter();

    // load fonts
    const [loaded, error] = useFonts({        
        Inter_500Medium,
    })

    // add limit hook
    const add = useAddLimit();
    const {
        types,      setTypes,
        amount,     setAmount,
        currency,   setCurrency,
        expense_types, currency_types,
        load1, load2,
        submit: addLimit,
    } = useMonthlyLimitForm(add);

    // Reload whenever access this screen
    const { data: preferenceCurrency, loading: preferenceCurrencyLoading, refetch: refetchCurrency } = useCurrencyPreference();
    
      /* ────────── local state for the field ────────── */
    const [openCurrency, setOpenCurrency] = useState(false);
  
    useEffect(()=>{
        if(!preferenceCurrencyLoading) {
          setCurrency(preferenceCurrency)
        }
    },[preferenceCurrencyLoading, preferenceCurrency])
    
    useFocusEffect(
      React.useCallback(() => {
        refetchCurrency();
      }, [refetchCurrency])
    );
  
    // Reload whenever access this screen
    if (!loaded && !error) {
        return null
    }

    // If loading, show spinner
    if (load1 || load2) {
        return <ActivityIndicator style={{ flex: 1 }} />;
    }

    const pastelColors = ['#FFE5EC','#E5F9E0','#E4ECFF','#FFF4D6','#F1E4FF'];

    const onAddPress = async () => {
        await addLimit();     // wait for submit to complete
        onClose();              // close modal after success
        router.replace('/(tabs)/monthly_limit/allLimits')
    };

    const toggleItem = (item) => {
      setTypes((prev) =>
        prev.includes(item)
          ? prev.filter((i) => i !== item)
          : [...prev, item]
      );
    };

    const itemsPerRow = 2;
    const rows = [];

    for (let i = 0; i < expense_types.length; i += itemsPerRow) {
      rows.push(expense_types.slice(i, i + itemsPerRow));
    }
    
    const allSelected = types.length === expense_types.length;

    const toggleSelectAll = () => {
      if (allSelected) {
        setTypes([]); // unselect all
      } else {
        setTypes([...expense_types]); // select all
      }
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
              Add Budget
            </Text>

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

              placeholder="Select"
              searchable
              zIndex={10}        /* avoids overlap inside ScrollViews / modals */
            />

            {/* Select a Category */}
            <View
              style= {{flexDirection: 'row', marginTop: 5,}}
            >
              <Text style={styles.label}>Select a Category</Text>
              <TouchableOpacity
                onPress={toggleSelectAll}
                style={{
                  padding: 10,
                  backgroundColor: '#ccc',
                  borderRadius: 10,
                  alignSelf: 'flex-start',
                  marginBottom: 10,
                  marginLeft: 10,
                }}
              >
                <Text>{allSelected ? 'Unselect All' : 'Select All'}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ marginVertical: 10 }}>
              {rows.map((row, rowIndex) => (
                <View
                  key={rowIndex}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                  }}
                >
                  {row.map((type, i) => {
                    const active = types.includes(type);
                    const bgColour = active
                      ? pastelColors[(rowIndex * itemsPerRow + i) % pastelColors.length]
                      : '#eee';
                    return (
                      <TouchableOpacity
                        key={type}
                        onPress={() => toggleItem(type)}
                        style={[
                          styles.pill,
                          {
                            backgroundColor: bgColour,
                            flex: 1,
                            marginHorizontal: 2,
                          },
                        ]}
                      >
                        <Text>{type}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Add Button */}
            <TouchableOpacity onPress={onAddPress} style={styles.addButton}>
                <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>

            {/* Back Button */}
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
                <Text style={[styles.backButtonText]}>Back</Text>
            </TouchableOpacity>
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
  label: {
    alignSelf: 'flex-start',
    marginBottom: 4,
    marginTop: 12,
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
    // ── Pill  
  pill: {
    paddingVertical: 4,            
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
    alignItems: 'center',
  justifyContent: 'center',
  },

  // ── Dropdown Styles ───────────────────────────────────────────────────────────
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
