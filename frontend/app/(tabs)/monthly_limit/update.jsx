import React, { useState } from 'react';
import { ActivityIndicator, TextInput, View, Text, TouchableOpacity, ScrollView, StyleSheet, } from 'react-native';
import { useRouter, useLocalSearchParams  } from 'expo-router';
import DropDownPicker from "react-native-dropdown-picker";
import { Inter_500Medium, useFonts } from "@expo-google-fonts/inter";
import { useUpdateLimit } from "@/hooks/crud";
import { useMonthlyLimitForm } from "@/hooks/monthlyLimitForm";
import { MaterialIcons } from '@expo/vector-icons';

export default function AddLimit() {  
    const { id } = useLocalSearchParams(); 
    const update = useUpdateLimit();
    const {
        types,      setTypes,
        amount,     setAmount,
        currency,   setCurrency,
        expense_types, currency_types,
        load1, load2,
        submit: updateLimit,
    } = useMonthlyLimitForm(update, id);

    const router = useRouter();
    const [loaded, error] = useFonts({        
        Inter_500Medium,
    })
    
      /* ────────── local state for the field ────────── */
    const [openCurrency, setOpenCurrency] = useState(false);
    
    if (!loaded && !error) {
        return null
    }

    if (load1 || load2) {
        return <ActivityIndicator style={{ flex: 1 }} />;
    }

    const toggleType = (opt) => {
        setTypes((prev) =>
            prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
        );
    }

    const toggleAll = () => {
        const allSelected = types.length === expense_types.length;
        setTypes(allSelected ? [] : [...expense_types]);
    };

    function CustomCheckbox({ checked, onChange }) {
        return (
            <TouchableOpacity onPress={() => onChange(!checked)} style={{padding: 4,}}>
            <MaterialIcons
                name={checked ? 'check-box' : 'check-box-outline-blank'}
                size={24}
            />
            </TouchableOpacity>
        );
    }

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

    const pastelColors = ['#FFE5EC','#E5F9E0','#E4ECFF','#FFF4D6','#F1E4FF'];

    const allSelected = types.length === expense_types.length;

    const toggleSelectAll = () => {
      if (allSelected) {
        setTypes([]); // unselect all
      } else {
        setTypes([...expense_types]); // select all
      }
    };

    return (
    <ScrollView contentContainerStyle={[styles.card, { paddingTop: 70 }]}>
        <Text style={styles.heading}>Update Budget Limit</Text>

        {/* ── Category chips  (single-select) ───────────────────── */}
        <View
          style= {{flexDirection: 'row', }}
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

        {/* ── Amount ─────────────────────────────────────────── */}
        <Text style={styles.label}>Amount</Text>
        <TextInput
        style={styles.input}
        placeholder="0.00"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
        />

        {/* ── Currency  ───────────────────────────────────────── */}
        <Text style={styles.label}>Currency</Text>
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


        {/* ── Buttons ────────────────────────────────────────── */}
        <TouchableOpacity onPress={updateLimit} style={styles.saveBtn}>
        <Text style={styles.btnTxt}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity
        onPress={() => router.replace('/(tabs)/monthly_limit/allLimits')}
        style={styles.cancelBtn}
        >
        <Text style={[styles.btnTxt, { color: '#000' }]}>Back</Text>
        </TouchableOpacity>
    </ScrollView>
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
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    marginLeft: 8,
    fontSize: 16,
  },
  wrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  typeItem: {
    width: '50%',          // two per row
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  card: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  heading: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
    color: '#4CAF50',
  },

  label: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 4,
  },

  pill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 20,
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

  /* buttons */
  saveBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 16,
  },
  cancelBtn: {
    backgroundColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  btnTxt: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});