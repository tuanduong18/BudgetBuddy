import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Inter_500Medium, useFonts } from '@expo-google-fonts/inter';
import Ionicons from '@expo/vector-icons/Ionicons';
import numeral from 'numeral';

export default function GroupDetails() {
  const { expense, group_id } = useLocalSearchParams();
  const curr = JSON.parse(expense);
  const router = useRouter();
  const [loaded, error] = useFonts({ Inter_500Medium });

  if (!loaded && !error) return null;

  const date = new Date(curr.time);
  const day = date.toLocaleString('en-US', { day: '2-digit' });
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();

  /**
   * Render a single borrower row showing their name, owed amount, and
   * settlement status (green ✔ with strikethrough if settled, red ✖ if not).
   *
   * @param {object} item - Borrower object:
   *   name     {string}  Username.
   *   amount   {number}  Amount owed.
   *   currency {string}  ISO 4217 currency code.
   *   settled  {boolean} Whether this owe row has been paid.
   */
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
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
});
