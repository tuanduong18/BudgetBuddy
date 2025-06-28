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
  //@params
  //  type: "settlement" or "expense"
  const renderHistory = ({item, index}) => {
    const colors = ['#FFEBEE', '#E3F2FD', '#E8F5E9', '#FFF3E0', '#F3E5F5'];
    const bgColor = colors[index % colors.length];
    if (item.type === "settlement"){
      //@params
      //  payer: string,
      //  payee: string,
      //  amount: float,
      //  currency: string,
      //  time: time string in isoformat,
      const date = new Date(item.time);
      const day = date.getDate();
      const month = date.toLocaleString('en-US', { month: 'short' });
      const year = date.getFullYear();
      return (
        <View
          style={[styles.card, { backgroundColor: bgColor }]}
        >
          <View style={[{
            flexDirection: 'row', 
            flex: 1,
            }]}>
            <FontAwesome name="money" size={24} color="black" />
            <Text style={styles.category}>
              {"  "}{item.payer} paid {item.payee} {item.amount} {item.currency} at {`${day} ${month}, ${year}`}
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
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: bgColor }]}
        onPress={()=>router.replace({ 
          pathname: '/(tabs)/split/expenseDetails', 
          params: { expense: JSON.stringify(item) , group_id: id } 
        })}
      >
        <View style={{
          flexDirection: 'row', 
          flexWrap: 'wrap',
          }}>
          <FontAwesome name="bell-o" size={24} color="black" />
          <Text style={styles.category}>
            {"  "}{item.note} cost {item.amount} {item.currency}
          </Text>

        </View>
      </TouchableOpacity>
    );
  };
      

  const onButtonPress = async () => {
    await left({id: id});
    router.replace('/(tabs)/split');
  };
  return (
    <>
        <View style={styles.container}>
            <Ionicons name="arrow-back" size={24} color="black" style={{paddingTop:10,}}
            onPress = {() => router.replace('/(tabs)/split')}
          />
            <Text style={[styles.title, {paddingTop: -20}]}>{details.name} </Text>
            <Text style={styles.title}>#{details.group_id}</Text>
            <View style={{
              height:200,
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
              }}>
              <Text style={styles.title}>Members</Text>
              <FlatList
                data={details.members}
                renderItem={renderMember}
                keyExtractor = {(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
            </View>
            <TouchableOpacity 
              onPress={() => router.replace({ pathname: '/(tabs)/split/owes', params: { id: id } })}
             style={[GS.button, { backgroundColor: '#ddd' }]}>
              <Text style={GS.buttonText}>See my owes</Text>
            </TouchableOpacity>
            <FlatList
                data={details.settlements.concat(details.history)}
                renderItem={renderHistory}
                keyExtractor = {(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
            <TouchableOpacity
              style={styles.floatingButton}
              onPress={() => setAddVisible(true)}
            >
              <Ionicons name="add-outline" size={32} color="#fff" />
            </TouchableOpacity>
            <Button 
                title="Leave group" 
                onPress={onButtonPress} 
                style = {styles.saveButton}
            />
            <AddGroupExpense visible={addVisible} onClose={() => setAddVisible(false)} data={JSON.stringify(details.members)} group_id={id}/>
        </View>
        </>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffde1a',
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
    top: 50,
    right: 24,
    backgroundColor: '#4CAF50',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
