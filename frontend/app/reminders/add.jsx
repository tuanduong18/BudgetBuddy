import React, { useContext } from 'react';
import { Button, ActivityIndicator, TextInput, View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import createStyles from "./style";
import { Inter_500Medium, useFonts } from "@expo-google-fonts/inter";
import { ThemeContext } from "@/context/ThemeContext";
import { useAddSubscription } from "@/hooks/reminder";
import { useSubscriptionForm } from "@/hooks/subsriptionForm";

export default function AddExpense() {  
    const add = useAddSubscription();
    const {
        name,      setName,
        sday,      setsDay,
        smonth,    setsMonth,
        syear,     setsYear,
        eday,      seteDay,
        emonth,    seteMonth,
        eyear,     seteYear,

        // submit fn
        submit: addSubs
    } = useSubscriptionForm(add);

    const router = useRouter();
    const {colorScheme, setColorScheme, theme} = useContext(ThemeContext)
    const [loaded, error] = useFonts({        
        Inter_500Medium,
    })
    
    if (!loaded && !error) {
        return null
    }

    const styles = createStyles(theme, colorScheme);
    // Screen
    return (
        <>

        <View style={styles.container}>
            <Text type="label">Name</Text>
            <TextInput
                style={styles.input}
                placeholder="Name..."
                value={name}
                maxLength={40}
                onChangeText={setName}
            />
            <Text type="label">Start date (DD / MM / YYYY)</Text>
            <View style={styles.dateRow}>
                <TextInput
                    style={[styles.input, styles.dateInput]}
                    placeholder="DD"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={sday}
                    onChangeText={setsDay}
                />
                <Text style={styles.dateSep}>/</Text>
                <TextInput
                    style={[styles.input, styles.dateInput]}
                    placeholder="MM"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={smonth}
                    onChangeText={setsMonth}
                />
                <Text style={styles.dateSep}>/</Text>
                <TextInput
                    style={[styles.input, styles.dateYearInput]}
                    placeholder="YYYY"
                    keyboardType="number-pad"
                    maxLength={4}
                    value={syear}
                    onChangeText={setsYear}
                />
            </View>

            <Text type="label">End date (DD / MM / YYYY)</Text>
            <View style={styles.dateRow}>
                <TextInput
                    style={[styles.input, styles.dateInput]}
                    placeholder="DD"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={eday}
                    onChangeText={seteDay}
                />
                <Text style={styles.dateSep}>/</Text>
                <TextInput
                    style={[styles.input, styles.dateInput]}
                    placeholder="MM"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={emonth}
                    onChangeText={seteMonth}
                />
                <Text style={styles.dateSep}>/</Text>
                <TextInput
                    style={[styles.input, styles.dateYearInput]}
                    placeholder="YYYY"
                    keyboardType="number-pad"
                    maxLength={4}
                    value={eyear}
                    onChangeText={seteYear}
                />
            </View>

            <Button 
                title="Save" 
                onPress={addSubs} 
                style = {styles.saveButton}
            />
            <Button 
                title="Back" 
                onPress={() => router.replace('/reminders/allReminders')} 
                style = {styles.saveButton}
            />
        </View>
        </>
    );
}

