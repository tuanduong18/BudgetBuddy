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
import { Ionicons } from '@expo/vector-icons'; // for the floating "+" button
import { useRouter } from 'expo-router';
import { useNewestExpenses, useUsername } from '@/hooks/data';
import { useFocusEffect } from "@react-navigation/native";
import AddExpenseModal from './add'; 

export default function ExpensesScreen() {
  const router = useRouter();
  const [addVisible, setAddVisible] = useState(false);

  /* Fetch user latest expenses
  @params
    total: float 2 decimal point,
    currency: string 3 characters,
    newestExpenses: list of 5 newest expenses,
  */
  const { data: expenses, loading, refetch: refetchExpense } = useNewestExpenses();
  
  // Fetch username
  const { data: username, usernameLoading: loadUsername, refetch: refetchUsername } = useUsername();

  // Reload whenever access this screen once
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

  

  // 5) Render a single transaction row
  const renderItem = ({ item, index }) => {
    const itemDate = new Date(item.time);
    const day = itemDate.getDate().toString().padStart(2, '0');
    const month = (itemDate.getMonth() + 1).toString().padStart(2, '0');
    const year = itemDate.getFullYear();

    const pastelColors = ['#E3F2FD', '#E8F5E9', '#FFF3E0', '#F3E5F5', '#FFEBEE'];
    const bgColor = pastelColors[index % pastelColors.length];

    const title =
      item.category === 'Other' && item.optional_cat
        ? item.optional_cat
        : item.category;

    return (
      <View style={[styles.transactionCard, { backgroundColor: bgColor }]}>
        <View style={styles.transactionText}>
          <Text style={styles.txnTitle}>{item.category} </Text>
          <Text style={styles.txnDescription}>{item.description}</Text>
        </View>
        <View style={styles.transactionMeta}>
          <Text
            style={[
              styles.txnAmount,
              { color: Number(item.amount) >= 0 ? 'green' : 'red' },
            ]}
          >
            {Number(item.amount) >= 0 ? '+' : '-'} {Math.abs(item.amount)} {item.currency}
          </Text>
          <Text style={styles.txnDate}>{`${day}/${month}/${year}`}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi, {username} 👋</Text>
          <Text style={styles.subtext}>Check out some friendly reminders!</Text>
        </View>

        {/* Clicking the profile pic navigates to /profile */}
        <TouchableOpacity onPress={() => router.push('/(tabs)/user/profile')}>
          <Image
            source={require('@/assets/images/profile_pic.png')} 
            style={styles.profilePic}
          />
        </TouchableOpacity>
      </View>

      {/* Alerts Block */}
      <View style={styles.alertBlock}>
        <Text style={styles.alertText}>🔔 Alerts</Text>
        <Text style={styles.alertContent}>
          Spotify May subscription ends tomorrow!
        </Text>
      </View>

      {/* ── 1) Summary Card ───────────────────────────────────────────────────────── */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>Today, you have spent...</Text>
        <Text style={styles.summaryAmount}> {expenses.total} {expenses.currency}</Text>
      </View>

      {/* ── 3) FlatList of Only the 5 Most Recent Expenses ────────────────────────── */}
      <FlatList
        data={expenses.newestExpenses}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>No recent Expenses.</Text>
        )}
      />

      {/* ── 4) “See Full History” Link (Below the 5 Items) ─────────────────────────── */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/personal_expenses/history')}
        style={styles.seeHistoryContainer}
      >
        <Text style={styles.seeHistoryText}>
          See full history or edit an expense? Click here!
        </Text>
      </TouchableOpacity>

      {/* ── 5) Floating “+” Button ────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setAddVisible(true)}
      >
        <Ionicons name="add-outline" size={32} color="#fff" />
      </TouchableOpacity>

      {/* ── 6) AddExpenseModal ─────────────────────────────────────────────────────── */}
      <AddExpenseModal visible={addVisible} onClose={() => setAddVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: 20,
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

  alertBlock: {
    backgroundColor: '#5B57D3',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  alertText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  alertContent: {
    color: '#fff',
    fontSize: 14,
  },

  // ── Summary Card ─────────────────────────────────────────────────────────────
  summaryCard: {
    backgroundColor: '#B3E5FC',
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

  // ── “Latest transactions” Header ─────────────────────────────────────────────
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign:'center',
  },

  // ── Each Transaction Row ─────────────────────────────────────────────────────
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

  // ── “See Full History” Link ───────────────────────────────────────────────────
  seeHistoryContainer: {
    marginTop: 8,
    alignItems: 'center',
    marginBottom: 170, // ensure the floating button does not overlap
  },
  seeHistoryText: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },

  emptyText: {
    textAlign: 'center',
    color: '#777',
    marginVertical: 20,
  },

  // ── Floating “+” Button ───────────────────────────────────────────────────────
  floatingButton: {
    position: 'absolute',
    bottom: 100,
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
