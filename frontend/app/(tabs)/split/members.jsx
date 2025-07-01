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
import { useGroupDetails } from '@/hooks/data';
import { useLeaveGroup } from '@/hooks/crud';
import { Inter_500Medium, useFonts } from '@expo-google-fonts/inter';
import { useFocusEffect } from "@react-navigation/native";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import AddGroupExpense from './addExpense';
import { GlobalStyles as GS } from '@/constants/GlobalStyles';

export default function GroupDetails() {
  // ─── Hooks & State (always at top) ───────────────────────────────────────────
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

  const renderMember = ({ item, index }) => {
        const colors = ['#FFEBEE', '#E3F2FD', '#E8F5E9', '#FFF3E0', '#F3E5F5'];
        const bgColor = colors[index % colors.length];
        return (
            <View style={[styles.card, { backgroundColor: bgColor }]}>
              <Text style={styles.category}>{item}</Text>
            </View>
        );
      };
      

  const onButtonPress = async () => {
    await left({id: id});
    router.replace('/(tabs)/split');
  };
  return (
    <>
        <View style={styles.container}>
          <View style = {{width:'10%'}}> 
            <Ionicons name="arrow-back" size={30} color="black"
            onPress = {() => router.replace({ pathname: '/(tabs)/split/groupDetails', params: { id: id } })}
          />
          </View>
            <Text style={styles.grpID}>Group code: #{details.group_id}</Text>
            {/* <View style={{
              height:'50%',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              // iOS shadow
              backgroundColor:'white',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              // Android elevation
              elevation: 3,
              }}> */}
              <Text style={styles.title}>Members</Text>
              <FlatList
                data={details.members}
                renderItem={renderMember}
                keyExtractor = {(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
            {/* </View> */}
            <TouchableOpacity 
                onPress={onButtonPress} 
                style={[styles.button, { backgroundColor: '#F28589', margineTop: 8 }]}>
                <Text style={styles.buttonText}>Leave Group</Text>
            </TouchableOpacity>
            <AddGroupExpense visible={addVisible} onClose={() => setAddVisible(false)} data={JSON.stringify(details.members)} group_id={id}/>
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
});
