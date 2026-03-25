import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGroupDetails } from '@/hooks/data';
import { useLeaveGroup } from '@/hooks/crud';
import { Inter_500Medium, useFonts } from '@expo-google-fonts/inter';
import { useFocusEffect } from "@react-navigation/native";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import AddGroupExpense from './addExpense';
import numeral from 'numeral';
import socket from '@/constants/socket';
import * as Clipboard from 'expo-clipboard';

export default function GroupDetails() {
  // hooks
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const left = useLeaveGroup();
  const [addVisible, setAddVisible] = useState(false);
  const {data: details, loading, refetch: refetchDetails} = useGroupDetails({group_id: id});
  // Font loading
  const [loaded, error] = useFonts({ Inter_500Medium });

  useFocusEffect(
      React.useCallback(() => {
        refetchDetails({group_id: id});
      }, [refetchDetails])
    );
    
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }
    // Join the Socket.IO room for this group so the server can broadcast
    // table_update events scoped only to this group's members.
    socket.emit('join_group', { group_id: id });

    // Re-fetch group details whenever the server signals a database change.
    socket.on('table_update', () => {
      refetchDetails({ group_id: id });
    });

    // Disconnect cleanly when the component unmounts to avoid stale listeners.
    return () => {
      socket.disconnect();
    };
  }, [id, refetchDetails]);


  // Early returns (now safe, because hooks are already called)
  if (!loaded && !error) {
    return null; // font not ready
  }
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(details.group_id);
    Alert.alert("Copied to clipboard");
  };


  /**
   * Render a single history row.
   *
   * Each item is either a Settlement or a GroupExpense (distinguished by item.type).
   * Settlements are non-interactive; expenses navigate to the expenseDetails screen.
   *
   * Settlement shape:
   *   payer    {string}  Username of the person who paid.
   *   payee    {string}  Username of the person who received payment.
   *   amount   {number}  Amount transferred.
   *   currency {string}  ISO 4217 currency code.
   *   time     {string}  ISO 8601 date string.
   *
   * GroupExpense shape:
   *   id        {number}  Primary key.
   *   lender    {string}  Username of the payer.
   *   amount    {number}  Total amount paid.
   *   currency  {string}  ISO 4217 currency code.
   *   note      {string}  Short description.
   *   time      {string}  ISO 8601 date string.
   *   borrowers {Array}   Per-borrower owe entries:
   *               name     {string}  Username.
   *               amount   {number}  Amount owed.
   *               currency {string}  Currency code.
   *               settled  {boolean} Whether the owe row is paid.
   */
  const renderHistory = ({ item, index }) => {
    const colors = ['#FFEBEE', '#E3F2FD', '#E8F5E9', '#FFF3E0', '#F3E5F5'];
    const bgColor = colors[index % colors.length];
    if (item.type === 'settlement') {
      const day = date.toLocaleString('en-US', { day:   '2-digit' });
      const month = date.toLocaleString('en-US', { month: 'short' });
      const year = date.getFullYear();
      return (
        <View
          style={[styles.card, { backgroundColor: bgColor }]}
        >
          <View style={styles.topRow}>
            <FontAwesome name="money" size={24} color="black" />
            <Text style={styles.titleText}>
              {'  '}
              {item.payer} paid {item.payee}
          </Text>
          </View>
            <View style={styles.bottomRow}>
              <Text style={styles.amountText}>
                Pay amount: {numeral(item.amount).format('0.00 a')} {item.currency}
              </Text>
              <Text style={styles.dateText}>
                {`${day} ${month}, ${year}`}
              </Text>
          </View>
        </View>
      );
    }

    //@params
    //  id: int
    //  lender: string,
    //  amount: float,
    //  currency: string,
    //  note: string,
    //  time: time string in isoformat,
    //  borrowers: list of dictionaries
    //    @params:
    //      name: string
    //      amount: float
    //      currency: string
    //      settled: boolean
    const date = new Date(item.time);
    const day = date.toLocaleString('en-US', { day:   '2-digit' });
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return (
      <TouchableOpacity
        onPress={()=>router.replace({ 
          pathname: '/(tabs)/split/expenseDetails', 
          params: { expense: JSON.stringify(item) , group_id: id } 
        })}
      >
        <View
          style={[styles.card, { backgroundColor: bgColor }]}
        >
          <View style={styles.topRow}>
            <FontAwesome name="bell-o" size={24} color="black" />
            <Text style={styles.titleText}>
              {"  "}{item.note}
            </Text>
          </View>

          <View style={styles.bottomRow}>
              <Text style={styles.amountText}>
                Shared amount: {numeral(item.amount).format('0.00 a')} {item.currency}
              </Text>
              <Text style={styles.dateText}>
                {`${day} ${month}, ${year}`}
              </Text>
          </View>
        </View>

      </TouchableOpacity>
    );
  };
      
  return (
    <>
        <View style={styles.container}>
          <View style={{
            flexDirection: 'row', 
            flexWrap: 'wrap',
            justifyContent:'space-between',
          }}>
            <Ionicons name="arrow-back" size={30} color="black"
              onPress = {() => router.replace('/(tabs)/split')}
            />
            <Ionicons name="settings-outline" size={30} color="black"
              onPress= {()=> router.replace({ pathname: '/(tabs)/split/members', params: { id: id } })}
            />
          </View>
            
            <Text style={[styles.title, {paddingTop: -20}]}>{details.name} </Text>
            <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
              <Text style={styles.grpID}>Group code: #{details.group_id}</Text>
              <TouchableOpacity onPress={copyToClipboard} style = {{paddingBottom: 5,}}>
                <Ionicons name="copy-outline" size={24} color="black" style = {{paddingBottom: 20, paddingLeft: 10,}}/>
              </TouchableOpacity>
            </View>
            <FlatList
                data={details.settlements.concat(details.history)}
                renderItem={renderHistory}
                keyExtractor = {(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}Add commentMore actions
                contentContainerStyle={{ paddingBottom: 20 }}
            />
            <TouchableOpacity 
              onPress={() => router.replace({ pathname: '/(tabs)/split/owes', params: { id: id } })}
             style={[styles.button, { backgroundColor: '#767FA6', marginTop: 8 }]}>
              <Text style={styles.buttonText}>See my owes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.floatingButton}
              onPress={() => setAddVisible(true)}
            >
              <Ionicons name="add-outline" size={32} color="#fff" />
            </TouchableOpacity>
            <AddGroupExpense visible={addVisible} onClose={() => setAddVisible(false)} data={JSON.stringify(details.members)} group_id={id}/>
        </View>
        </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 50,
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
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
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
    bottom: 20,
    right: 24,
    backgroundColor: '#4CAF50',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grpID: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#003366'
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    marginLeft: 70,
    marginRight: 70,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,     
  },
  titleText: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1, 
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 14,
    color: '#555',
  },
});
