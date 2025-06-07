import React, { useState, useEffect } from 'react';
import {
  Text, View, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Button
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Picker } from "@react-native-picker/picker";
import { useExpenses, useCurrencyTypes, useCurrencyPreference } from '@/hooks/data';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from "@react-navigation/native";

export default function AllExpenses() {
  // search for params: currency when navigate to this screen
  const { cur } = useLocalSearchParams();

  // fetch data based on user's currency preference
  const { data: expenses, loading: expenseLoading, refetch: refetchExpenses } = useExpenses({currency: cur})

  // fetch all CurrencyTypes
  const { data: currencyTypes, loading: currencyLoading } = useCurrencyTypes();

  // load user's preference 
  const { data: preferenceCurrency, loading: preferenceCurrencyLoading, refetch: refetchCurrency } = useCurrencyPreference();

  // set visible currency variable
  const [currency, setCurrency] = useState("");

  // Reload whenever access this screen
    useFocusEffect(
      React.useCallback(() => {
        refetchExpenses({currency: cur});
        refetchCurrency();
      }, [refetchExpenses, refetchCurrency])
    );
  
  // set initial value to user's preference
  useEffect(()=>{
    if(!preferenceCurrencyLoading) {
      setCurrency(preferenceCurrency)
    }
  },[preferenceCurrencyLoading, preferenceCurrency])

  const router = useRouter();
  const [query, setQuery] = useState('');

  if (expenseLoading || currencyLoading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  const filtered = expenses.filter(item =>
    item.category.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase())
  );

  const renderItem = ({ item, index }) => {
    const date = new Date(item.time);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const colors = ['#FFEBEE', '#E3F2FD', '#E8F5E9', '#FFF3E0', '#F3E5F5'];
    const bgColor = colors[index % colors.length];

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: bgColor }]}
        onPress={() =>
          router.replace({ pathname: '/personal_expenses/update', params: { id: item.id } })
        }
      >
        <View>
          <Text style={styles.category}>{item.category}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
        <View style={styles.details}>
          <Text style={[styles.amount, { color: item.amount > 0 ? 'green' : 'red' }]}> 
            {item.amount} {item.currency}
          </Text>
          <Text style={styles.date}>{`${day} ${month}, ${year}`}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={{
        flexDirection: 'row', 
        flexWrap: 'wrap',
      }}>
        <Ionicons name="arrow-back" size={24} color="black" style={{paddingRight: '24%',}}
          onPress = {() => router.replace('/(tabs)/personal_expenses/expenses')}
        />
        <Text style={styles.title}>All Expenses</Text>
      </View>
      <TextInput
        style={styles.search}
        placeholder="Search category or description"
        value={query}
        onChangeText={setQuery}
      />
      {/* Currency setting box */}
      <View style={styles.pickerWrapper}>
              <Picker
                  enabled={!currencyLoading}
                  selectedValue={currency}
                  onValueChange={setCurrency}
                  style={styles.picker}
              >
              <Picker.Item
                  label="Original"
                  value={""}
              />
              {currencyLoading
                  ? <Picker.Item label="Loading…" value="" />
                  : currencyTypes.map(t => <Picker.Item key={t} label={t} value={t} />)
              }
              </Picker>

              <Button 
                  title="Change currency" 
                  onPress={() => currency == "" 
                    ? router.replace('/(tabs)/personal_expenses/history')
                    : router.replace({
                        pathname:'/(tabs)/personal_expenses/history',
                        params: {"cur": currency}
                    })
                  }
                  
              />
          </View>
      <FlatList
        data={filtered}
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
        borderWidth: 1,

        borderRadius: 4,
        marginBottom: 12,
        overflow: "hidden",
  },
  picker: {
      height: 50,
      width: "100%",
  },
});
