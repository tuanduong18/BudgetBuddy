import React, {useEffect, useState } from 'react';
import { Keyboard, TouchableWithoutFeedback, TextInput, View, Text, StyleSheet, Platform, Modal, TouchableOpacity, ScrollView, Button, ActivityIndicator } from 'react-native';
import { Inter_500Medium, useFonts } from "@expo-google-fonts/inter";
import DropDownPicker from "react-native-dropdown-picker";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAddGroupExpense } from "@/hooks/crud";
import { GlobalStyles as GS } from '@/constants/GlobalStyles';
import { useGroupExpenseForm } from '@/hooks/groupExpenseForm';
import { useCurrencyPreference } from '@/hooks/data';
import { useFocusEffect } from "@react-navigation/native";
import ModalSelector from 'react-native-modal-selector';

export default function AddGroupExpense({ visible, onClose, data, group_id }) {  
    const addExpense = useAddGroupExpense();
    const members = JSON.parse(data);
    const {
      rows,       
      note,       setNote,
      amount,     setAmount,
      currency,   setCurrency,
      selectedMembers,
      total,
      time,
      showDatePicker, setShowDatePicker,
      handleAddRow,
      handleChangeRow,
      handleRemoveRow,
      onDateChange,
      handleDivideEqually,

      currency_types,

      // loading flags
      load3, load2,

      // submit fn
      submit,
    } = useGroupExpenseForm(group_id, members, addExpense)    

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


    const onSubmit = async () => {
      await submit();         // wait for submit to complete
      onClose();              // close modal after success
    };

    const [loaded, error] = useFonts({        
        Inter_500Medium,
    })
    
    if (!loaded && !error) {
        return null
    }

    if (load3 || load2) {
        return (
          <View style={styles.spinnerContainer}>
            <ActivityIndicator size="large" />
          </View>
        );
      }

    // Screen  
    return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <ScrollView
        contentContainerStyle={{         
          flexGrow: 1,                    //     make container fill the screen
          justifyContent: 'flex-end',     //     push its child (backdrop) to the bottom
        }}
        keyboardShouldPersistTaps="handled"
      >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.backdrop}>
          <View style={GS.card}>
            <Text style={[GS.title, { color: '#4CAF50', alignSelf: 'center' }]}>New group expense</Text>
            {/* Description */}
            <Text style={[GS.footerText, styles.label]}>Note</Text>
            <TextInput
              style={GS.input}
              placeholder="e.g. Dinner split"
              placeholderTextColor={GS.placeholder}
              value={note}
              onChangeText={setNote}
            />

            {/* Amount field takes 65% of the space, with a little right margin */}
            <Text style={[GS.footerText, styles.label]}>Amount</Text>
                <TextInput
                  style={GS.input}
                  placeholder="0.00"
                  placeholderTextColor={GS.placeholder}
                  value={amount}
                  keyboardType="decimal-pad"
                  onChangeText={setAmount}
            />

            {/* Currency field takes the rest (35%) */}
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

            {/* Date */}
            <Text style={[GS.footerText, styles.label]}>Date</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={[GS.input, { justifyContent: 'center' }]}
              >
                <Text>{`${time.getDate()}/${(time.getMonth() + 1)}/${time.getFullYear()}`}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={time}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                />
              )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Split among</Text>
              <TouchableOpacity 
                onPress={handleDivideEqually} 
                style={{
                  width: 100,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#4CAF50',
                  alignItems: 'center',
                  justifyContent: 'center',
                  elevation: 3,
                }}
                
              >
                <Text style={{ color: '#fff', fontSize: 12 }}>{'Divide equally'}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleAddRow} 
                style={[
                  styles.fab,
                  rows.length >= members.length && { opacity: 0.4 }
                ]}
                disabled={rows.length >= members.length}
              >
                <Text style={styles.fabText}>+</Text>
              </TouchableOpacity>
            </View>

            <View
              
              contentContainerStyle={{ paddingVertical: 0 }}
              keyboardShouldPersistTaps="always"
              showsVerticalScrollIndicator={true}
            >
              {rows.map((row, idx) => (
                <View style={{
                  flexWrap: 'wrap', 
                  flexDirection: 'row',
                  display: 'flex', 
                  alignItems:'stretch',
                  height:40,
                  marginBottom:8              
                  }}>
                  
                  {Platform.OS === 'ios' 
                  ?<>
                  <View key={idx} style={{width: '55%', height: '100%',}} >
                    <ModalSelector
                      data={members
                            .filter(m => m === row.member || !selectedMembers.includes(m))
                            .map(m => ({ key: m, label: m }))}
                      initValue="Select member"
                      onChange={(option) => handleChangeRow(idx, 'member', option.key)}
                      style={styles.selector}
                      initValueTextStyle={{ color: '#666' }}
                      selectTextStyle={{ fontSize: 14,color: '#666' }}
                    />
                    </View>
                  </> 
                  :
                  <View key={idx} style={{width: '55%', height: '100%', justifyContent: 'center'}}>
                  <Picker
                    selectedValue={row.member}
                    onValueChange={val => handleChangeRow(idx, 'member', val)}
                    style={[styles.picker, {
                      height: 70,
                      fontSize: 12,
                      marginTop:7
                    }]}

                  >
                  <Picker.Item label="Select member" value="" />
                  {members
                    .filter(m => m === row.member || !selectedMembers.includes(m))
                    .map(m => (
                      <Picker.Item key={m} label={m} value={m} />))}
                  </Picker>
                  </View>
                  }
                  
                  
                  <View style={{width: '35%', height: '100%',}}>   
                      <TextInput
                        style={{height: '100%', textAlign: 'center'}}
                        keyboardType="numeric"
                        placeholder="Value"
                        value={row.value}
                        onChangeText={text => handleChangeRow(idx, 'value', text)}
                      />
                    </View>
                  <View style={{width: '10%', height: '100%',}}>
                      <Button title="–" onPress={() => handleRemoveRow(idx)} />
                    </View>
                </View> 
              ))}

              
            </View>
            

              <Text style={{color: total == amount ? 'green': 'red', paddingVertical:5}}>Total: {total} / {amount} {currency}</Text>

              <TouchableOpacity onPress={onSubmit} style={styles.addButton}>
                <Text style={styles.addButtonText}>Submit</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} style={styles.backButton}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
      </ScrollView>
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

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,             
    marginBottom: 4,
  },

  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_500Medium',
    color: '#4CAF50',
  },

  fab: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },

  fabText: { color: '#fff', fontSize: 24, lineHeight: 24 },
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
  selector: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
},
});
