import React, { useContext, useEffect } from 'react';
import { Platform, Button, ActivityIndicator, TextInput, View, Text, Alert, TouchableOpacity, ScrollView, StyleSheet, } from 'react-native';
import { useRouter, useLocalSearchParams  } from 'expo-router';
import { Picker } from "@react-native-picker/picker";
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
    // useEffect(()=>{
    //     console.log(types) check for tick boxes
    // }, [types])
    const router = useRouter();
    const [loaded, error] = useFonts({        
        Inter_500Medium,
    })
    
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

    const pastel = ['#D0E8F2','#FADADD','#C1F0DC','#FFFACD','#EADCF2','#FFEDCC'];
    // Screen
//     return (
//         <>
//         <View style={styles.container}>
//             <Text type="label">Choose Group of types (at least 1 element)</Text>
//             <ScrollView
//                 style={{ maxHeight: 200 }}
//                 contentContainerStyle={styles.wrapContainer}
//             >
//                 {/* Select All checkbox */}
//                 <TouchableOpacity
//                 key="__select_all__"
//                 style={styles.typeItem}
//                 onPress={toggleAll}
//                 >
//                 <CustomCheckbox
//                     checked={types.length === expense_types.length}
//                     onChange={toggleAll}
//                 />
//                 <Text style={styles.label}>Select All</Text>
//                 </TouchableOpacity>
//                 {expense_types.map(type => (
//                     <TouchableOpacity key={type} style={styles.typeItem} onPress={() => toggleType(type)}>
//                     <CustomCheckbox checked={types.includes(type)} onChange={() => toggleType(type)} />
//                     <Text style={styles.label}>{type}</Text>
//                     </TouchableOpacity>
//                 ))}
//             </ScrollView>

//             <Text type="label">Amount</Text>
//             <TextInput
//                 style={styles.input}
//                 placeholder="0.00"
//                 value={amount}
//                 keyboardType="decimal-pad"
//                 onChangeText={setAmount}
//             />

//             <Text type="label">Currency</Text>
//             <View style={styles.pickerWrapper}>
//                 <Picker
//                     enable={!load2}
//                     selectedValue={currency}
//                     onValueChange={setCurrency}
//                     style={styles.picker}
//                 >
//                 {load2
//                     ? <Picker.Item label="Loading…" value="" />
//                     : currency_types.map(t => <Picker.Item key={t} label={t} value={t} />)
//                 }
//                 </Picker>
//             </View>

//             <Button 
//                 title="Save" 
//                 onPress={updateLimit} 
//                 style = {styles.saveButton}
//             />
//             <Button 
//                 title="Back" 
//                 onPress={() => router.replace('/(tabs)/monthly_limit/allLimits')} 
//                 style = {styles.saveButton}
//             />
//         </View>
//         </>
//     );
// }

    return (
    <ScrollView contentContainerStyle={[styles.card, { paddingTop: 40 }]}>
        <Text style={styles.heading}>Update Budget Limit</Text>

        {/* ── Category chips  (single-select) ───────────────────── */}
        <Text style={styles.label}>Select a Category</Text>
        <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginVertical: 10 }}
        >
        {expense_types.map((type, i) => {
            const active = types[0] === type;               // single choice
            const bg     = active ? pastel[i % pastel.length] : '#eee';
            return (
            <TouchableOpacity
                key={type}
                onPress={() => setTypes([type])}            // single choice setter
                style={[styles.pill, { backgroundColor: bg }]}
            >
                <Text>{type}</Text>
            </TouchableOpacity>
            );
        })}
        </ScrollView>

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
        <View style={styles.pickerWrapper}>
        <Picker
            selectedValue={currency}
            onValueChange={setCurrency}
            mode="dropdown"
            style={styles.picker}
            dropdownIconColor="#666"
        >
            {currency_types.map(c => (
            <Picker.Item key={c} label={c} value={c} />
            ))}
        </Picker>
        {Platform.OS === 'web' && (
            <View style={styles.webArrow}>
            <Text style={{ color: '#666', fontSize: 12 }}>▼</Text>
            </View>
        )}
        </View>

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

  /* picker wrapper (same as expense screen) */
  pickerWrapper: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#000',
    backgroundColor: '#f5f5f5',
    ...Platform.select({
      web: { borderWidth: 0, appearance: 'none', WebkitAppearance: 'none', paddingHorizontal: 12 },
      ios: {}, android: {},
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

  /* buttons */
  saveBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
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