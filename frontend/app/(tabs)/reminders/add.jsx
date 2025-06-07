import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, Platform, Modal, TouchableOpacity, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Inter_500Medium, useFonts } from "@expo-google-fonts/inter";
import { useAddSubscription } from "@/hooks/reminder";
import { GlobalStyles as GS } from '@/constants/GlobalStyles';
import { useSubscriptionForm } from "@/hooks/subsriptionForm";

export default function AddReminder({ visible, onClose }) {  
    const add = useAddSubscription();
    const {
        name,       setName,
        start_time, setStartTime,
        end_time,   setEndTime,

        // submit fn
        submit: addSubs
    } = useSubscriptionForm(add);

    const [showsDatePicker, setShowsDatePicker] = useState(false);
    const [showeDatePicker, setShoweDatePicker] = useState(false);

    const [loaded, error] = useFonts({        
        Inter_500Medium,
    })
    
    if (!loaded && !error) {
        return null
    }

    const onAddPress = async () => {
      await addSubs();        // wait for submit to complete
      onClose();              // close modal after success
    };

    const onEDateChange = (event, selectedDate) => {
      setShoweDatePicker(false);
      if (selectedDate) {
        setEndTime(selectedDate);
      }
    };

    const onSDateChange = (event, selectedDate) => {
      setShowsDatePicker(false);
      if (selectedDate) {
        setStartTime(selectedDate);
      }
    };

    // Screen
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
      <View style={styles.backdrop}>
        <View style={GS.card}>
          <Text style={[GS.title, { color: '#4CAF50', alignSelf: 'center' }]}>
            Add Subscription & Reminder
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Description */}
            <Text style={[GS.footerText, styles.label]}>Description</Text>
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
                  onChange={onSDateChange}
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
                  onChange={onEDateChange}
                />
              )}

            {/* Add Button */}
            <TouchableOpacity onPress={onAddPress} style={styles.addButton}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>

            {/* Back Button */}
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Text style={[styles.backButtonText]}>Back</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
    );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  spinnerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    alignSelf: 'flex-start',
    marginBottom: 4,
    marginTop: 12,
  },

  // ── Picker Wrapper ───────────────────────────────────────────────────────────
  pickerWrapper: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#000',
    backgroundColor: '#f5f5f5',
    ...Platform.select({
      web: {
        borderWidth: 0,
        appearance: 'none',
        WebkitAppearance: 'none',
        paddingHorizontal: 12,
      },
      ios: {},
      android: {},
    }),
  },
  webArrow: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    pointerEvents: 'none',
  },

  // ── Buttons ─────────────────────────────────────────────────────────────────────
  addButton: {
    marginTop: 16,
    marginBottom: 12,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#fff',
  },
  backButton: {
    marginBottom: 24,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#ccc',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#000',
  },
});
