import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { useRouter } from 'expo-router';
import { useNewestExpenses, useUsername } from '@/hooks/data';
import { useFocusEffect } from "@react-navigation/native";
import AddExpenseModal from './add';
import numeral from 'numeral'; 

export default function ExpensesScreen() {
  const router = useRouter();
  const [addVisible, setAddVisible] = useState(false);

  /**
   * Dashboard data returned by /expenses/data/dashboard:
   *   total         {number} Today's total spending, rounded to 2 d.p.
   *   currency      {string} ISO 4217 display currency.
   *   newestExpenses {Array}  The 5 most recent expense objects.
   */
  const { data: expenses, loading, refetch: refetchExpense } = useNewestExpenses();

  const { data: username, usernameLoading: loadUsername, refetch: refetchUsername } = useUsername();

  // Re-fetch on every screen focus so the dashboard reflects the latest data.
  useFocusEffect(
    React.useCallback(() => {
      refetchExpense();
      refetchUsername();
    }, [refetchExpense, refetchUsername])
  );

  if (loading || loadUsername) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  

  /** Render a single expense row with a cycling pastel background. */
  const renderItem = ({ item, index }) => {
    // Format the ISO date string to DD/MM/YYYY for display.
    const itemDate = new Date(item.time);
    const day = itemDate.getDate().toString().padStart(2, '0');
    const month = (itemDate.getMonth() + 1).toString().padStart(2, '0');
    const year = itemDate.getFullYear();

    const pastelColors = ['#E3F2FD', '#E8F5E9', '#FFF3E0', '#F3E5F5', '#FFEBEE'];
    const bgColor = pastelColors[index % pastelColors.length];

    const title =
      item.category === 'Other' && item.description
        ? item.description
        : item.category;

    return (
      <TouchableOpacity 
        style={[styles.transactionCard, { backgroundColor: bgColor }]}
        onPress={() =>
          router.replace({ pathname: '/personal_expenses/update', params: { id: item.id } })
        }
      >
        <View style={styles.transactionText}>
          <Text style={styles.txnTitle}>{item.category} </Text>
          <Text style={styles.txnDescription}>{item.description}</Text>
        </View>
        <View style={styles.transactionMeta}>
          <Text
            style={[
              styles.txnAmount,
              { color: 'green' },
            ]}
          >
            {numeral(item.amount).format('0.0 a')} {item.currency}
          </Text>
          <Text style={styles.txnDate}>{`${day}/${month}/${year}`}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi, {username} 👋</Text>
        </View>

        <TouchableOpacity onPress={() => router.push('/(tabs)/user/profile')}>
          <Image
            source={require('@/assets/images/profile_pic.png')} 
            style={styles.profilePic}
          />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>Today, you have spent...</Text>
        <Text style={styles.summaryAmount}> {numeral(expenses.total).format('0.0 a')} {expenses.currency}</Text>
      </View>

      {/* FlatList of Only the 5 Most Recent Expenses */}
      <FlatList
        data={expenses.newestExpenses}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={() => (
          <Text style={[styles.title, {fontWeight:'normal'}]}>No recent Expenses.</Text>
        )}
      />

      {/* "See Full History" button (Below the 5 Items) */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/personal_expenses/history')}
        style={styles.historyButton}
      >
        <Ionicons name="time-outline" size={22} color="#fff" />
        <Text style={styles.historyText}>
          See full history
        </Text>
      </TouchableOpacity>

      {/* Floating "+" Button  */}
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
    backgroundColor: '#FFF',
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtext: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  profilePic: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    color: '#000',
    textAlign: 'center',
  },

  // Summary Card 
  summaryCard: {
    backgroundColor: '#9BE8F0',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },

  // Each Transaction Row 
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    // Android elevation
    elevation: 3,
  },
  transactionText: {
    flex: 2,
  },
  txnTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  txnDescription: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  txnDate: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
    textAlign: 'right',
  },
  txnAmount: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  transactionMeta: {
    flex: 1,
    alignItems: 'flex-end',
  },

  // History Button
  historyButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 28,          
    flexDirection: 'row',      
    alignItems: 'center',
    alignSelf: 'center',       
    paddingHorizontal: 24,     
    paddingVertical: 12,
    marginBottom: 20,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    // Android elevation
    elevation: 5,
    marginTop: 24,          
  },
  historyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,             
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
