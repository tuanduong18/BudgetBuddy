import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // for the floating "+" button
import { useRouter } from 'expo-router';
import { useExpenses } from '@/hooks/data';
import AddExpenseModal from './add'; 

export default function ExpensesScreen() {
  const router = useRouter();
  const [addVisible, setAddVisible] = useState(false);

  // 1) Fetch all expenses and loading flag
  const { data: expenses, loading } = useExpenses();

  // 2) Compute “today’s total”
  const todayTotal = useMemo(() => {
    if (!Array.isArray(expenses)) return 0;
    const now = new Date();
    return expenses
      .filter((item) => {
        const itemDate = new Date(item.time);
        return (
          itemDate.getDate() === now.getDate() &&
          itemDate.getMonth() === now.getMonth() &&
          itemDate.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [expenses]);

  // 3) Sort “newest first”
  const sortedExpenses = useMemo(() => {
    if (!Array.isArray(expenses)) return [];
    return [...expenses].sort((a, b) => new Date(b.time) - new Date(a.time));
  }, [expenses]);

  // 4) Take only the first 5 items for “latest transactions”
  const latestFive = useMemo(() => sortedExpenses.slice(0, 5), [sortedExpenses]);

  if (loading) {
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
          <Text style={styles.txnTitle}>{item.category}</Text>
          <Text style={styles.txnDescription}>{item.description}</Text>
        </View>
        <View style={styles.transactionMeta}>
          <Text
            style={[
              styles.txnAmount,
              { color: Number(item.amount) >= 0 ? 'green' : 'red' },
            ]}
          >
            {Number(item.amount) >= 0 ? '+' : '-'}${Math.abs(item.amount)}
          </Text>
          <Text style={styles.txnDate}>{`${day}/${month}/${year}`}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Expenses</Text>
      {/* ── 1) Summary Card ───────────────────────────────────────────────────────── */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>Today, you have spent...</Text>
        <Text style={styles.summaryAmount}>${todayTotal}</Text>
      </View>

      {/* ── 2) “Latest transactions” Header ─────────────────────────────────────────── */}
      <Text style={styles.sectionHeader}>Latest transactions</Text>

      {/* ── 3) FlatList of Only the 5 Most Recent Expenses ────────────────────────── */}
      <FlatList
        data={latestFive}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>No recent transactions.</Text>
        )}
      />

      {/* ── 4) “See Full History” Link (Below the 5 Items) ─────────────────────────── */}
      <TouchableOpacity
        onPress={() => router.push('/personal_expenses/history')}
        style={styles.seeHistoryContainer}
      >
        <Text style={styles.seeHistoryText}>
          See full history or edit a transaction? Click here!
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

  // ── Summary Card ─────────────────────────────────────────────────────────────
  summaryCard: {
    backgroundColor: '#B3E5FC',
    borderRadius: 16,
    padding: 20,
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
