import React, { useState } from 'react';
import { ActivityIndicator, TextInput, View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams  } from 'expo-router';
import DropDownPicker from "react-native-dropdown-picker";
import { Inter_500Medium, useFonts } from "@expo-google-fonts/inter";
import { useUpdateLimit, useDeleteLimit } from "@/hooks/crud";
import { useMonthlyLimitForm } from "@/hooks/monthlyLimitForm";

export default function AddLimit() {  
    const { id } = useLocalSearchParams(); 
    const update = useUpdateLimit();
    const deleteLimit = useDeleteLimit();
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
    
    // local state for the field 
    const [openCurrency, setOpenCurrency] = useState(false);
    
    if (!loaded && !error) {
        return null
    }

    if (load1 || load2) {
        return <ActivityIndicator style={{ flex: 1 }} />;
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

    /** Persist the updated limit then return to the list view. */
    const onSave = async () => {
        await updateLimit();
        router.replace('/(tabs)/monthly_limit/allLimits');
    };

    /** Confirm deletion via an alert, then remove the limit and navigate back. */
    const onDelete = () => {
        Alert.alert('Delete Monthly budget limit', 'Are you sure you want to delete this item?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
                const ok = await deleteLimit({ id });
                router.replace('/(tabs)/monthly_limit/allLimits');
            }
          }
        ]);
      };

    return (
    <ScrollView contentContainerStyle={[styles.card, { paddingTop: 70 }]}>
        <Text style={styles.heading}>Update Budget Limit</Text>

        {/* Category chips  (single-select) */}
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

        {/* Amount */}
        <Text style={styles.label}>Amount</Text>
        <TextInput
        style={styles.input}
        placeholder="0.00"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
        />

        {/* Currency */}
        <Text style={styles.label}>Currency</Text>
        <DropDownPicker
          open={openCurrency}
          value={currency}

          items={currency_types.map((c) => ({ label: c, value: c }))}
          setOpen={setOpenCurrency}
          setValue={setCurrency}    

          /* fixed light palette */
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


        {/* Buttons */}
        <TouchableOpacity onPress={onSave} style={styles.saveBtn}>
        <Text style={styles.btnTxt}>Save</Text>
        </TouchableOpacity>
        
        {/* Delete Button */}
        <TouchableOpacity onPress={onDelete} style={[styles.deleteBtn, { backgroundColor: '#f88' }]}>
          <Text style={[styles.btnTxt, { color: '#fff' }]}>Delete</Text>
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
  card: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
    color: '#4CAF50',
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

  // Buttons
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
    marginBottom: 0,
  },
  deleteBtn: {
    backgroundColor: '#f88',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnTxt: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});