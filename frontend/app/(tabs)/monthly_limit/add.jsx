import React, { useEffect} from 'react';
import { Keyboard, TouchableWithoutFeedback, Platform, Modal, ActivityIndicator, TextInput, View, Text, Alert, TouchableOpacity, ScrollView, StyleSheet, } from 'react-native';
import { useRouter } from 'expo-router';
import { Picker } from "@react-native-picker/picker";
import { Inter_500Medium, useFonts } from "@expo-google-fonts/inter";
import { useAddLimit } from "@/hooks/crud";
import { useMonthlyLimitForm } from "@/hooks/monthlyLimitForm";
import { MaterialIcons } from '@expo/vector-icons';
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
                  value={amount}
                  keyboardType="decimal-pad"
                  onChangeText={setAmount}
                />
            </View>

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
            

            {/* Select a Category */}
            <Text style={[GS.footerText, styles.label]}>Select a Category</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginVertical: 10 }}
            >
                {expense_types.map((type, i) => {
                    const active   = types[0] === type;
                    const bgColour = active
                        ? pastelColors[i % pastelColors.length]
                        : '#eee';
                    return (
                        <TouchableOpacity
                            key={type}
                            onPress={() => setTypes([type])}
                            style={[styles.pill, { backgroundColor: bgColour }]}
                        >
                            <Text>{type}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

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

});
