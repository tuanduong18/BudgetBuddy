import React, { useState } from 'react';
import { ActivityIndicator, Text, FlatList, View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSubscriptions } from '@/hooks/data';
import { useDeleteSubscription } from '@/hooks/reminder';
import * as Notifications from 'expo-notifications';
import Ionicons from '@expo/vector-icons/Ionicons';
import AddReminder from './add';

export default function AllReminders() {
    const [addVisible, setAddVisible] = useState(false);
    const router = useRouter();
    const deleteSubs = useDeleteSubscription();

    /**
     * Each subscription object returned by the API:
     *   id         {number} Primary key.
     *   name       {string} Subscription display name.
     *   noti_id    {string} Device-side notification identifier for cancellation.
     *   start_time {string} ISO 8601 start date.
     *   end_time   {string} ISO 8601 renewal/expiry date.
     */
    const { data: Subscriptions, loading } = useSubscriptions();

    if (loading) {
        return (
          <View style={styles.centered}>
            <ActivityIndicator size="large" />
          </View>
        );
      }

    /** Render a single subscription row, colour-coded by expiry status. */
    const renderItem = ({ item, index }) => {
        const now = new Date();
        const date = new Date(item.end_time);
        const day = date.getDate();
        const month = date.toLocaleString('en-US', { month: 'short' });
        const year = date.getFullYear();
        const colors = ['#FFEBEE', '#E3F2FD', '#E8F5E9', '#FFF3E0', '#F3E5F5'];
        const bgColor = colors[index % colors.length];
    
        return (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: bgColor }]}
            onPress={() =>
              router.replace({ pathname: '/(tabs)/reminders/update', params: { id: item.id, noti_id: item.noti_id } })
            }
          >
            <View>
              <Text style={styles.category}>{item.name}</Text>
    
            </View>
            <View style={styles.details}>
              <Text style={{ 
                color: date > now ? 'green' : 'red' , 
                fontSize: date > now ? 16 : 20, 
                fontWeight: date > now ? 'normal': 'bold',
              }}> 
                expired on {`${day} ${month}, ${year}`}
              </Text>
            </View>
          </TouchableOpacity>
        );
      };

    // Screen
    return (
        <>
        <View style={styles.container}>
            <Text style={styles.title}>All Subscription & Reminders</Text>

            <FlatList
                data={Subscriptions}
                renderItem={renderItem}
                keyExtractor = {(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 80 }}
            />

            <TouchableOpacity
              style={styles.floatingButton}
              onPress={() => setAddVisible(true)}
            >
              <Ionicons name="add-outline" size={32} color="#fff" />
            </TouchableOpacity>
            <AddReminder visible={addVisible} onClose={() => setAddVisible(false)} />
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
    bottom: 20,
    right: 24,
    backgroundColor: '#4CAF50',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
