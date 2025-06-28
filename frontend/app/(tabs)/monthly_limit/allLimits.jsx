import React, { useState, useEffect } from 'react';
import { Button, ActivityIndicator, Text, FlatList, View, Pressable, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Picker } from "@react-native-picker/picker";
import { Inter_500Medium, useFonts } from "@expo-google-fonts/inter";
import { useMonthlyLimits, useCurrencyTypes, useCurrencyPreference } from "@/hooks/data";
import { useFocusEffect } from "@react-navigation/native";
import { GlobalStyles as GS } from '@/constants/GlobalStyles';
import { ProgressChart } from "react-native-chart-kit";

export default function AllLimits() {
    // search for params: currency when navigate to this screen
    const { cur } = useLocalSearchParams();

    // set visible currency variable
    const [currency, setCurrency] = useState("");

    /* Fetch data based on user's currency preference
    @params
        id: int
        amount: float rounded to 2 decimal point 
        currency: string of length 3
        percentage: float rounded to 2 decimal point
        total: float rounded to 2 decimal point
        types: list of string (each string is an expense type)*/  
    const {data: Limits, loading: limitLoading, refetch: refetchLimit} = useMonthlyLimits({currency: cur});

    // load user's preference 
    const { data: preferenceCurrency, loading: preferenceCurrencyLoading, refetch: refetchCurrency } = useCurrencyPreference();

    // Reload whenever access this screen
      useFocusEffect(
        React.useCallback(() => {
          refetchCurrency();
          refetchLimit({currency: cur});
        }, [refetchCurrency])
      );
    

    // set initial value to user's preference
    useEffect(()=>{
        if(!preferenceCurrencyLoading) {
            setCurrency(preferenceCurrency)
        }
    }, [preferenceCurrencyLoading, preferenceCurrency])

    const router = useRouter();
    const [loaded, error] = useFonts({        
        Inter_500Medium,
    })

    // fetch all CurrencyTypes (return a list of string)
    const {data: currencyTypes, loading: currencyLoading} = useCurrencyTypes();

    if (!loaded && !error) {
        return null
    }

    if (limitLoading || currencyLoading) {
        return <ActivityIndicator style={{ flex: 1 }} />;
    }
    
    const renderItem = ({item}) => {
      const ratio = parseFloat(item.total) / parseFloat(item.amount);
      const item_data = {
        data: [ratio]
      } 
        return (
            <TouchableOpacity style={{
                flexDirection: 'row', 
                flexWrap: 'wrap',
                alignItems: 'center',
            }}
            onPress={()=>router.push({
                        pathname:'/monthly_limit/update',
                        params: {"id": item.id}
                    })}
            >
                  {/* <Text 
                    style={styles.category}                
                    onPress={()=>router.push({
                        pathname:'/monthly_limit/update',
                        params: {"id": item.id}
                    })}
                >
                    {item.percentage}% : {item.total} / {item.amount} {item.currency}
                </Text> */}

              <ProgressChart
                data={item_data}
                width={220}
                height={220}
                strokeWidth={16}
                radius={32}
                chartConfig={{
                  backgroundColor: "#e26a00",
                  backgroundGradientFrom: "#fb8c00",
                  backgroundGradientTo: "#ffa726",
                  decimalPlaces: 2, // optional, defaults to 2dp
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: "6",
                    strokeWidth: "2",
                    stroke: "#ffa726"
                  }
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16
                }}
                hideLegend={false}
              />
            </TouchableOpacity>

        );
    }

    // Screen
    return (
        <View style={styles.container}>
      
        <Text style={styles.title}>All Monthly limits</Text>
      
      
      {/* Currency setting box */}
      <View style={styles.pickerWrapper}>
        <Picker
          enabled={!currencyLoading}
          selectedValue={currency}
          onValueChange={setCurrency}
          mode="dropdown"
          style={styles.picker}
          dropdownIconColor="#666"
        >
          {currencyLoading
              ? <Picker.Item label="Loading…" value="" />
              : currencyTypes.map(t => <Picker.Item key={t} label={t} value={t} />)
          }
        </Picker>
        {Platform.OS === 'web' && (
          <View style={styles.webArrow}>
            <Text style={{ color: '#666', fontSize: 12 }}>▼</Text>
          </View>
        )}
      </View>
      
        <TouchableOpacity 
        onPress={() => currency == "" 
            ? router.replace('/(tabs)/monthly_limit/allLimits')
            : router.replace({
                pathname:'/(tabs)/monthly_limit/allLimits',
                params: {"cur": currency}
            })
          }
        style={[GS.button, { backgroundColor: '#ddd' }]}>
          <Text style={GS.buttonText}>Save</Text>
        </TouchableOpacity>

      <Button 
          title="Add new limit" 
          onPress={() => router.replace('/(tabs)/monthly_limit/add') }
      />
      <FlatList
        data={Limits}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
    </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffde1a',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  search: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  category: {
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  details: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
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
});
