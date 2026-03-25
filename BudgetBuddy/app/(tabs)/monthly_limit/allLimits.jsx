import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Text, FlatList, View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
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
    
    /**
     * Monthly limits returned by /limits/data/all (one per limit record):
     *   id         {number}   Primary key.
     *   amount     {number}   Budget cap (2 d.p.).
     *   currency   {string}   ISO 4217 display currency.
     *   percentage {number}   Current month's spend as % of cap.
     *   total      {number}   Current month's absolute spend.
     *   types      {string[]} Expense categories tracked by this limit.
     */
    const { data: Limits, loading: limitLoading, refetch: refetchLimit } = useMonthlyLimits({ currency: cur });

    // load user's preference 
    const { data: preferenceCurrency, loading: preferenceCurrencyLoading, refetch: refetchCurrency } = useCurrencyPreference();

    const PASTELS = [
      "#FFE5EC", // pink
      "#E5F9E0", // mint
      "#E4ECFF", // powder blue
      "#FFF4D6", // soft yellow
      "#F1E4FF"  // lavender
    ];

    // Re-fetch on every focus so cards reflect the current month's spend.
    useFocusEffect(
      React.useCallback(() => {
        refetchCurrency();
        refetchLimit({ currency: cur });
      }, [refetchCurrency])
    );

    // Pre-fill the display currency with the user's saved preference once loaded.
    useEffect(() => {
        if (!preferenceCurrencyLoading) {
            setCurrency(preferenceCurrency);
        }
    }, [preferenceCurrencyLoading, preferenceCurrency]);

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
    
    const month = new Date().toLocaleString('en-US', { month: 'long' });

    const renderItem = ({ item, index }) => {
      const spent      = parseFloat(item.total);      // already rounded on the API
      const cap        = parseFloat(item.amount);
      const remaining  = cap - spent;  
      const progress   = Math.min(spent / cap, 1) < 0 ? 0 : Math.min(spent / cap, 1);    // 0 → 1
      const bg         = PASTELS[index % PASTELS.length];
      const title      = item.types.length === 12 ? "Everything" : item.types.join(", ");       // “Food, Transport” …

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
        
        <Text style={styles.title}>{month} spending</Text>
  
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

  // General
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
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

  // Button 
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
  
  // Progress bar
  progressBar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(0,0,0,0.1)",
    overflow: "hidden",
  },
});
