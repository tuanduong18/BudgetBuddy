import React, { useState } from 'react';
import {
  Text, View, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { useExpenses } from '@/hooks/data';
import { useDeleteExpense } from '@/hooks/crud';

export default function AllExpenses() {
  const router = useRouter();
  const { data: Expenses, loading } = useExpenses();
  const deleteExpense = useDeleteExpense();
  const [query, setQuery] = useState('');

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  const filtered = Expenses.filter(item =>
    item.category.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase())
  );

  const renderItem = ({ item, index }) => {
    const date = new Date(item.time);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const colors = ['#FFEBEE', '#E3F2FD', '#E8F5E9', '#FFF3E0', '#F3E5F5'];
    const bgColor = colors[index % colors.length];

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: bgColor }]}
        onPress={() =>
          router.push({ pathname: '/personal_expenses/update', params: { id: item.id } })
        }
      >
        <View>
          <Text style={styles.category}>{item.category}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
        <View style={styles.details}>
          <Text style={[styles.amount, { color: item.amount > 0 ? 'green' : 'red' }]}>${item.amount}</Text>
          <Text style={styles.date}>{`${day} ${month}`}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Transactions</Text>

      <TextInput
        style={styles.search}
        placeholder="Search category or description"
        value={query}
        onChangeText={setQuery}
      />

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
});
