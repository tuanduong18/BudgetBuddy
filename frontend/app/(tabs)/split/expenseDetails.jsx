import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Button,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Inter_500Medium, useFonts } from '@expo-google-fonts/inter';
import Ionicons from '@expo/vector-icons/Ionicons';
import numeral from 'numeral';

export default function GroupDetails() {
  // ─── Hooks & State (always at top) ───────────────────────────────────────────
  const { expense, group_id } = useLocalSearchParams();
  const curr = JSON.parse(expense)
  const router = useRouter();
  // Font loading
  const [loaded, error] = useFonts({ Inter_500Medium });
  // ─── Early returns (now safe, because hooks are already called) ───────────────
  if (!loaded && !error) {
    return null; // font not ready
  }
  const date = new Date(curr.time);
  const day = date.toLocaleString('en-US', { day: '2-digit' });
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  //@params 
  //  name: string,
  //  amount: float,
  //  currency: string,
  //  settled: boolean
  const renderItem = ({item, index}) => {
    const colors = ['#FFEBEE', '#E3F2FD', '#E8F5E9', '#FFF3E0', '#F3E5F5'];
    const bgColor = colors[index % colors.length];
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: bgColor }]}
      >
        <View style={{
          flexDirection: 'row', 
          flexWrap: 'wrap',
          }}>
          <Text style={[styles.category, 
          {
            color: item.settled ? "green" : "red",
            textDecorationLine: item.settled ? 'line-through' : 'none',
          }]}>
            {item.settled ? "✔" : "✖"} {item.name} owes {numeral(item.amount).format('0.0 a')} {item.currency}
          </Text>

        </View>
      </TouchableOpacity>
    );
  };
      
  return (
    <>
        <View style={styles.container}>
          <View style={{width:'10%'}}>
            <Ionicons name="arrow-back" size={24} color="black" style={{paddingTop:10,}}
            onPress={() => router.replace({ pathname: '/(tabs)/split/groupDetails', params: { id: group_id } })}
          />          
          </View>
            <Text style={styles.title}>{curr.note} </Text>
            <Text style={styles.title}>{curr.lender} paid {numeral(curr.amount).format('0.0 a')} {curr.currency} </Text>
            <Text style={styles.title}> on {`${day} ${month}, ${year}`} </Text>
            <FlatList
                data={curr.borrowers}
                renderItem={renderItem}
                keyExtractor = {(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
        </>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  floatingButton: {
    position: 'absolute',
    bottom: 50,
    right: 24,
    backgroundColor: '#4CAF50',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
