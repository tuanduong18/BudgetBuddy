import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Button,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGroupOwes } from '@/hooks/data';
import { Inter_500Medium, useFonts } from '@expo-google-fonts/inter';
import { useFocusEffect } from "@react-navigation/native";
import { useSettleGroupExpense } from '@/hooks/crud';
import Ionicons from '@expo/vector-icons/Ionicons';
import numeral from 'numeral';

export default function GroupOwes() {
  // ─── Hooks & State (always at top) ───────────────────────────────────────────
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const settle = useSettleGroupExpense();
  const {data: owes, loading, refetch} = useGroupOwes({group_id: id});
  // Font loading
  const [loaded, error] = useFonts({ Inter_500Medium });
  useFocusEffect(
      React.useCallback(() => {
        refetch({group_id: id});
      }, [refetch])
    );
  // ─── Early returns (now safe, because hooks are already called) ───────────────
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
      
    //@params
    //   name: string
    //   amount: float
    //   currency: string
    //   owe: boolean
  const renderItem = ({item, index}) => {
    const colors = ['#FFEBEE', '#E3F2FD', '#E8F5E9', '#FFF3E0', '#F3E5F5'];
    const bgColor = colors[index % colors.length];
    const tday = new Date();
    if (item.owe) {
      return (
        <View style={[styles.card, { backgroundColor: bgColor }]}>
          <View style={styles.row}>
            <Text
              style={styles.category}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              You owe {item.name}{' '}
              {numeral(item.amount).format('0,0.[00]')} {item.currency}
            </Text>

            <TouchableOpacity
              style={styles.settleBtn}
              onPress={async () => {
                await settle({
                  payee: item.name,
                  group_id: id,
                  amount: item.amount,
                  currency: item.currency,
                  time: tday.toISOString(),
                });
                router.replace({
                  pathname: '/(tabs)/split/groupDetails',
                  params: { id },
                });
              }}
            >
              <Text style={styles.settleTxt}>Settle</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
  }

    /* creditor case */
    return (
      <View style={[styles.card, { backgroundColor: bgColor }]}>
        <Text style={styles.category}>
          {item.name} owes you{' '}
          {numeral(item.amount).format('0,0.[00]')} {item.currency}
        </Text>
      </View>
    );
  };
      
  return (
    <>
        <View style={styles.container}>
          <Ionicons name="arrow-back" size={24} color="black" style={{paddingTop:10,}}
            onPress={() => router.replace({ pathname: '/(tabs)/split/groupDetails', params: { id: id } })}
          />
            <Text style={styles.title}>List of owes</Text>
            <FlatList
                data={owes}
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
  
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  settleBtn: {
    backgroundColor: '#1976D2',   
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
    marginLeft: 30,
  },
  settleTxt: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  category: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
    marginRight: 8,
  },
});
