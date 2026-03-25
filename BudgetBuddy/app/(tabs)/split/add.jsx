import React, {useState} from 'react';
import { TextInput, View, Text, StyleSheet, Platform, Modal, TouchableOpacity, ScrollView, KeyboardAvoidingView } from 'react-native';
import { Inter_500Medium, useFonts } from "@expo-google-fonts/inter";
import { useCreateGroup, useJoinGroup } from "@/hooks/crud";
import { GlobalStyles as GS } from '@/constants/GlobalStyles';

export default function AddGroup({ visible, onClose }) {  
    const create = useCreateGroup();
    const join = useJoinGroup();

    const [name, setName] = useState("")
    const [code, setCode] = useState("")

    const [loaded, error] = useFonts({        
        Inter_500Medium,
    })
    
    if (!loaded && !error) {
        return null
    }

    /** Create a new group then close the modal. */
    const onAddPress1 = async () => {
      await create({ name });
      onClose();
    };

    /** Join an existing group by code then close the modal. */
    const onAddPress2 = async () => {
      await join({ id: code });
      onClose();
    };

    // Screen
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        {/* For iOS keyboard to not cover the input fields */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? -20 : 0}
        >
          <View style={styles.backdrop}>
            <View style={GS.card}>
              <Text style={[GS.title, { color: '#4CAF50', alignSelf: 'center' }]}>
                Create a new group or join a current group
              </Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Group name */}
                <Text style={[GS.footerText, styles.label]}>Name</Text>
                <TextInput
                  style={GS.input}
                  placeholder="e.g. JB trip"
                  placeholderTextColor={GS.placeholder}
                  value={name}
                  onChangeText={setName}
                />

                {/* Add Button */}
                <TouchableOpacity onPress={onAddPress1} style={styles.addButton}>
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>

                {/* Group code */}
                <Text style={[GS.footerText, styles.label]}>Group code</Text>
                <TextInput
                  style={GS.input}
                  placeholder="e.g. 123456"
                  placeholderTextColor={GS.placeholder}
                  value={code}
                  onChangeText={setCode}
                />

                {/* Add Button */}
                <TouchableOpacity onPress={onAddPress2} style={styles.addButton}>
                  <Text style={styles.addButtonText}>Join</Text>
                </TouchableOpacity>

                {/* Back Button */}
                <TouchableOpacity onPress={onClose} style={styles.backButton}>
                  <Text style={[styles.backButtonText]}>Back</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>  
          </View>
       </KeyboardAvoidingView>
    </Modal>
    );
}

const styles = StyleSheet.create({
  // General
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

  // Buttons 
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
