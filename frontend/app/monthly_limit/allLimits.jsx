import React, { useContext, useState, useEffect } from 'react';
import { Button, ActivityIndicator, Text, FlatList, View, Pressable, StyleSheet, } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Picker } from "@react-native-picker/picker";
import { Inter_500Medium, useFonts } from "@expo-google-fonts/inter";
import { useMonthlyLimits, useCurrencyTypes } from "@/hooks/data";
import { useDeleteLimit } from '@/hooks/crud';

export default function AllLimits() {
    const { cur } = useLocalSearchParams();  
    const router = useRouter();
    const [loaded, error] = useFonts({        
        Inter_500Medium,
    })  
    const {data: Limits, loading: load1} = useMonthlyLimits({currency: cur});
    const deleteLimit = useDeleteLimit();
    const {data: currency_types, loading: load2} = useCurrencyTypes();
    const [currency, setCurrency] = useState("");
    if (!loaded && !error) {
        return null
    }

    if (load1) {
        return <ActivityIndicator style={{ flex: 1 }} />;
    }
    
    const renderItem = ({item}) => {
        return (
            <View style={{
                flexDirection: 'row', 
                flexWrap: 'wrap',
                alignItems: 'center',
            }}
                >
                <Text style={{fontSize:18, color: 'red', width:"50%"}}
                    onPress={()=>router.push({
                        pathname:'/monthly_limit/update',
                        params: {"id": item.id}
                    })}
                >
                    {item.types.length == 12 ? "All": item.types.map(x=> x + ", ")}
                </Text>
                <Text style={{fontSize:18, color: 'red', width:"30%"}}>
                    {item.percentage}% : {item.total} / {item.amount} {item.currency}
                </Text>
                <Text 
                    style={{fontSize:18, color: 'red', textAlign: 'middle'}} 
                    onPress={() => deleteLimit({id: item.id})}
                >
                    Delete
                </Text>
            </View>

        );
    }

    const keyExtractor = (item, index) => index.toString();

    // Screen
    return (
        <>
        <View style={styles.container}>
            
            <Text type="title"> All Monthly Limit </Text>
            <View style={styles.pickerWrapper}>
                <Picker
                    enabled={!load2}
                    selectedValue={currency}
                    onValueChange={setCurrency}
                    style={styles.picker}
                >
                <Picker.Item
                    label="Original"
                    value={null}
                    color="#999"
                />
                {load2
                    ? <Picker.Item label="Loading…" value="" />
                    : currency_types.map(t => <Picker.Item key={t} label={t} value={t} />)
                }
                </Picker>

                <Button 
                    title="Change currency" 
                    onPress={() => currency == "" 
                        ? router.replace('/monthly_limit/allLimits')
                        : router.replace({
                            pathname:'/monthly_limit/allLimits',
                            params: {"cur": currency}
                        })
                    }
                    style = {styles.saveButton}
                />
            </View>

            <FlatList
                data={Limits}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                showsVerticalScrollIndicator={false}
            />
            
            <Button 
                title="add" 
                onPress={() => router.replace('/monthly_limit/add')} 
                style = {styles.saveButton}
            />
            <Button 
                title="home" 
                onPress={() => router.replace('/tabs/home_page')} 
                style = {styles.saveButton}
            />
        </View>
        </>
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
    // ...Platform.select({
    //   web: {
    //     borderWidth: 0,
    //     appearance: 'none',
    //     WebkitAppearance: 'none',
    //     paddingHorizontal: 12,
    //   },
    //   ios: {},
    //   android: {},
    //}),
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
});