import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Text, FlatList, View, Pressable, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Inter_500Medium, useFonts } from "@expo-google-fonts/inter";
import { useMonthlyLimits, useCurrencyTypes, useCurrencyPreference } from "@/hooks/data";
import { useFocusEffect } from "@react-navigation/native";
import Ionicons from '@expo/vector-icons/Ionicons';
import AddLimit from './add';
import numeral from 'numeral';

export default function AllLimits() {
    // search for params: currency when navigate to this screen
    const { cur } = useLocalSearchParams();

    // set visible currency variable
    const [currency, setCurrency] = useState("");

    const [addVisible, setAddVisible] = useState(false);
    
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

    const PASTELS = [
      "#FFE5EC", // pink
      "#E5F9E0", // mint
      "#E4ECFF", // powder blue
      "#FFF4D6", // soft yellow
      "#F1E4FF"  // lavender
    ];

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
    
    const renderItem = ({ item, index }) => {
    const spent      = parseFloat(item.total);      // already rounded on the API
    const cap        = parseFloat(item.amount);
    const remaining  = cap - spent;  
    const progress   = Math.min(spent / cap, 1);    // 0 → 1
    const bg         = PASTELS[index % PASTELS.length];
    const title      = item.types.join(", ");       // “Food, Transport” …

    return (
        <TouchableOpacity
          style={[styles.card, { backgroundColor: bg }]}
          onPress={() => router.push({ pathname: "/monthly_limit/update", params: { id: item.id } })}
        >
          {/* Title */}
          <Text style={styles.cardTitle}>{title}</Text>

          {/* Figures */}
          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Total Paid</Text>
              <Text style={styles.value}>
                {currency} {numeral(spent).format('0.0 a')}
              </Text>
            </View>
            <View>
              {remaining > 0
              ? (<><Text style={styles.label}>Total Remaining</Text><Text style={styles.value}>
                {currency} {numeral(remaining).format('0.0 a')}
              </Text></>)
              : (<><Text style={styles.label}>Overshooting</Text>
              <Text style={styles.value}>
                {currency} {numeral(-remaining).format('0.0 a')}
              </Text></>)
              }
              
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBar}>
            <View style={{ 
              height:'100%', 
              width: `${progress * 100}%`, 
              backgroundColor:remaining > 0 ? 'green' : 'red'
              }} />
          </View>
        </TouchableOpacity>
      );
    };
    // Screen
    return (
    <View style={styles.container}>
        
        <Text style={styles.title}>All Monthly limits</Text>
  
        <FlatList
          data={Limits}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        />

        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setAddVisible(true)}
        >
          <Ionicons name="add-outline" size={32} color="#fff" />
        </TouchableOpacity>

        <AddLimit visible={addVisible} onClose={() => setAddVisible(false)} />
        
    </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 60,
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
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 24,
    backgroundColor: '#4CAF50',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
  borderRadius: 16,
  padding: 20,
  marginBottom: 16,
},

cardTitle: {
  fontSize: 18,
  fontWeight: "600",
  marginBottom: 12,
},

row: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 12,
},

label: {
  fontSize: 12,
  color: "#666",
},

value: {
  fontSize: 20,
  fontWeight: "700",
},

progressBar: {
  height: 10,
  borderRadius: 5,
  backgroundColor: "rgba(0,0,0,0.1)",
  overflow: "hidden",
},

progressFill: {
  height: "100%",
  backgroundColor: "#CE5C5E", 
},

});
