import React, { useState } from 'react';
import { TextInput, Text, Alert, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Inter_500Medium, useFonts } from "@expo-google-fonts/inter";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useUpdateSubscription, useDeleteSubscription } from "@/hooks/reminder";
import { useSubscriptionForm } from "@/hooks/subsriptionForm";
import { GlobalStyles as GS } from '@/constants/GlobalStyles';

export default function AddExpense() {  
    const { id, noti_id } = useLocalSearchParams();
    const update = useUpdateSubscription();
    const {
        name,       setName,
        start_time, setStartTime,
        end_time,   setEndTime,

        // submit fn
        submit: updateSub
    } = useSubscriptionForm(update, id);

    const [showsDatePicker, setShowsDatePicker] = useState(false);
    const [showeDatePicker, setShoweDatePicker] = useState(false);
    
    const remove = useDeleteSubscription();

    const router = useRouter();
    const [loaded, error] = useFonts({        
        Inter_500Medium,
    })
    
    if (!loaded && !error) {
        return null
    }

    const onDelete = () => {
      Alert.alert('Delete Subscription & Reminder', 'Are you sure you want to delete this item?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await remove({ id, noti_id });
            router.replace('/(tabs)/reminders/allReminders');
          }
        }
      ]);
    };
  
  
    const onSave = async () => {
      await updateSub();
      router.replace('/(tabs)/reminders/allReminders');
    };
  
    const onCancel = () => {
      router.replace('/(tabs)/reminders/allReminders');
    };

    // Screen
    return (
      <ScrollView contentContainerStyle={[GS.card, { padding: 24, backgroundColor: '#fff' }]}>
      <Text style={GS.title}>Update Subscription & Reminder</Text>

      {/* ─── “Description”  ─────────────────────────────── */}
      <Text style={GS.footerText}>Description</Text>
      <TextInput
        style={GS.input}
        placeholder="e.g. Gym Membership"
        value={name}
        onChangeText={setName}
      />

      {/* Start date */}
      <Text style={[GS.footerText, styles.label]}>Start Date</Text>
        <TouchableOpacity
          onPress={() => setShowsDatePicker(true)}
          style={[GS.input, { justifyContent: 'center' }]}
        >
          <Text>{`${start_time.getDate()}/${(start_time.getMonth() + 1)}/${start_time.getFullYear()}`}</Text>
        </TouchableOpacity>
        {showsDatePicker && (
          <DateTimePicker
            value={start_time}
            mode="date"
            display="default"
            onChange={setStartTime}
          />
        )}

      {/* End date */}
      <Text style={[GS.footerText, styles.label]}>End Date</Text>
        <TouchableOpacity
          onPress={() => setShoweDatePicker(true)}
          style={[GS.input, { justifyContent: 'center' }]}
        >
          <Text>{`${end_time.getDate()}/${(end_time.getMonth() + 1)}/${end_time.getFullYear()}`}</Text>
        </TouchableOpacity>
        {showeDatePicker && (
          <DateTimePicker
            value={end_time}
            mode="date"
            display="default"
            onChange={setEndTime}
          />
        )}

      {/* ─── Save Button (navigates back after saving) ──────────────────────────────── */}
      <TouchableOpacity onPress={onSave} style={GS.button}>
        <Text style={GS.buttonText}>Save</Text>
      </TouchableOpacity>

      {/* ─── Delete Button ───────────────────────────────────────────────────────────── */}
      <TouchableOpacity onPress={onDelete} style={[GS.button, { backgroundColor: '#f88' }]}>
        <Text style={[GS.buttonText, { color: '#fff' }]}>Delete</Text>
      </TouchableOpacity>

      {/* ─── Cancel Button ───────────────────────────────────────────────────────────── */}
      <TouchableOpacity onPress={onCancel} style={[GS.button, { backgroundColor: '#ddd' }]}>
        <Text style={[GS.buttonText, { color: '#000' }]}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
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
  pickerWrapper: {
        borderWidth: 1,

        borderRadius: 4,
        marginBottom: 12,
        overflow: "hidden",
  },
  picker: {
      height: 50,
      width: "100%",
  },
});

