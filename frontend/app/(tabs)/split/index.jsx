import React, { useEffect, useState } from 'react';
import { SafeAreaView, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Text, Platform, View, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Inter_500Medium, useFonts } from "@expo-google-fonts/inter";
import { useGroupNames } from "@/hooks/data";
import { useFocusEffect } from "@react-navigation/native";
import Ionicons from '@expo/vector-icons/Ionicons';
import AddGroup from './add';
import { G } from 'react-native-svg';

export default function HomeScreen() {  
    const router = useRouter();
    const [addVisible, setAddVisible] = useState(false);
    const [loaded, error] = useFonts({        
        Inter_500Medium,
    })  
    const {data: Groups, loading, refetch: refetchGroups} = useGroupNames();

    // Reload whenever access this screen once
    useFocusEffect(
      React.useCallback(() => {
        refetchGroups();
      }, [refetchGroups, addVisible])
    );

    // If fonts are not loaded or there's an error, return null
    if (!loaded && !error) {
        return null
    }

    if (loading) {
        return (
          <View style={styles.centered}>
            <ActivityIndicator size="large" />
          </View>
        );
      }

    const renderItem = ({ item, index }) => {
      // const itemDate = new Date(new Date());
      // const day = itemDate.getDate().toString().padStart(2, '0');
      // const month = (itemDate.getMonth() + 1).toString().padStart(2, '0');
      // const year = itemDate.getFullYear();
    
      const pastelColors = ['#E3F2FD', '#E8F5E9', '#FFF3E0', '#F3E5F5', '#FFEBEE'];
      const bgColor = pastelColors[index % pastelColors.length];
      return (
        <TouchableOpacity
          style={[styles.card, { backgroundColor: bgColor }]}
          onPress={() =>
            router.replace({ pathname: '/(tabs)/split/groupDetails', params: { id: item.group_id } })
          }
        >
          <View>
            <Text style={styles.category}>{item.name}</Text>
  
          </View>

          <View style={styles.GroupText}>
            <Text style={styles.grpTitle}>{item.category} </Text>
            {/* <Text style={styles.grpCreateDate}>{`${day}/${month}/${year}`}</Text> */}
          </View>

        </TouchableOpacity>
      );
    };

    // Home Screen
    return (
      <>
        <View style={styles.container}>
            <Text style={styles.title}>All Groups</Text>

            <FlatList
                data={Groups}
                renderItem={renderItem}
                keyExtractor = {(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={() => (
                  <Text style={styles.emptyText}>No recent shared expenses.</Text>
                )}
            />

            <TouchableOpacity
              style={styles.floatingButton}
              onPress={() => setAddVisible(true)}
            >
              <Ionicons name="add-outline" size={32} color="#fff" />
            </TouchableOpacity>
            <AddGroup visible={addVisible} onClose={() => setAddVisible(false)} />
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
    paddingTop: 60,
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
  GroupText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
  },
  grpTitle: {
    fontSize: 16,
    fontWeight: '600',
  },  
  grpCreateDate: {
    fontSize: 12,
    color: '#777',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
    fontSize: 16,
  },
  
});
