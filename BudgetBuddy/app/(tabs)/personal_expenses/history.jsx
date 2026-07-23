import React, { useState, useEffect } from 'react';
import {
  Platform, Text, View, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DropDownPicker from "react-native-dropdown-picker";
import { useExpenses, useCurrencyTypes, useCurrencyPreference } from '@/hooks/data';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from "expo-router";
import numeral from 'numeral'; 
import { GlobalStyles as GS } from '@/constants/GlobalStyles';
// Imported from the '/legacy' entry point on purpose. The main
// 'expo-file-system' entry now exposes the File/Directory API, and its
// re-exports of writeAsStringAsync / cacheDirectory / EncodingType are stubs
// that throw at runtime, which silently broke the CSV export below.
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AddExpenseModal from './add';

export default function AllExpenses() {
  // search for params: currency when navigate to this screen
  const { cur } = useLocalSearchParams();

  // fetch data based on user's currency preference
  const { data: expenses, loading: expenseLoading, refetch: refetchExpenses } = useExpenses({currency: cur})

  // fetch all CurrencyTypes
  const { data: currencyTypes, loading: currencyLoading } = useCurrencyTypes();

  // load user's preference 
  const { data: preferenceCurrency, loading: preferenceCurrencyLoading, refetch: refetchCurrency } = useCurrencyPreference();

  // local state for the field 
  const [openCurrency, setOpenCurrency] = useState(false);
  
  // set visible currency variable
  const [currency, setCurrency] = useState("");

  // modal
  const [addVisible, setAddVisible] = useState(false);

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

  const exportCSV = async () => {
    try {
      // console.log(expenses);
      // Create CSV string
      const headerString = 'Category,Amount,Currency,Description,Date\n';
      const rowString = expenses
        .map(d => `${d.category},${d.amount},${d.currency},${d.description},${d.time}`)
        .join('\n');
      const csvString = `${headerString}${rowString}`;

      // Create a file URI in the cache directory
      const fileUri = FileSystem.cacheDirectory + 'expenses.csv';

      // Write to file
      await FileSystem.writeAsStringAsync(fileUri, csvString, {
        encoding: FileSystem.EncodingType.UTF8
      });

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        alert("Sharing isn't available on this platform");
      }
    } catch (err) {
      console.error('Error exporting CSV:', err);
    }  finally {
      setIsSharing(false);
    }
  };

  if (expenseLoading || currencyLoading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  const filtered = expenses.filter(item =>
    item.category.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase())
  );

  // render each item in the list
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
          <Text style={[styles.amount, { color:'green'}]}> 
            {numeral(item.amount).format('0.0 a')} {item.currency}
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
        justifyContent:'space-between',
      }}>
        <Ionicons name="arrow-back" size={30} color="black"
          onPress = {() => router.replace('/(tabs)/personal_expenses/expenses')}
        />
        {/* Title  */}
        <Text style={styles.title}>All Expenses</Text>
        <Ionicons name="share-social-outline" size={30} color="black"
          onPress={exportCSV}/>
      </View>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#888" style={styles.icon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search category or description"
          placeholderTextColor={GS.placeholder}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* Currency setting box */}
      <View style={styles.currencyRow}>
        <View style={{ flex: 0.75, marginRight: 8 }}>
        {/* dropdown  */}
          <DropDownPicker
                  open={openCurrency}
                  value={currency}

                  items={currencyTypes.map((c) => ({ label: c, value: c }))}
                  setOpen={setOpenCurrency}
                  setValue={setCurrency}    

                  // fixed light palette
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                  textStyle={styles.dropdownText}
                  listItemLabelStyle={styles.dropdownText}

                  placeholder="Select"
                  searchable
                  zIndex={10}        
          />
        </View>

        {/* change button */}
        <TouchableOpacity
          style={[styles.changeBtn, { flex: 0.25 }]} 
          onPress={() =>
            currency === ''
              ? router.replace('/(tabs)/personal_expenses/history')
              : router.replace({
                  pathname: '/(tabs)/personal_expenses/history',
                  params: { cur: currency },
                })
          }
        >
          <Text style={styles.changeTxt}>Change</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
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

      {/* AddExpenseModal */}
      <AddExpenseModal visible={addVisible} onClose={() => setAddVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  // General
  container: {
    flex: 1,
    backgroundColor: '#fff',
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

  // Search box
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',   // light grey backdrop
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6, 
    marginBottom: 16,
  },
  icon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,               // take the remaining width
    fontSize: 16,
    padding: 0,            // remove default vertical padding on iOS
  },

  // Currency setting box
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  currencyPicker: {
    flex: 1,                
    backgroundColor: '#f4f4f4',
    borderRadius: 10,
    marginRight: 10,
    height: 50,
    paddingVertical: 12,
  },

  // Change button
  changeBtn: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 17,
    borderRadius: 10,
  },
  changeTxt: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Floating "+" Button 
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
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    // Android elevation
    elevation: 5,
  },
});
