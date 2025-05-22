import React, { useContext, useState, useEffect } from 'react';
import { Button, ActivityIndicator, TextInput, View, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Picker } from "@react-native-picker/picker";
import createStyles from "./style";
import { Inter_500Medium, useFonts } from "@expo-google-fonts/inter";
import { ThemeContext } from "@/context/ThemeContext";
import { useUpdateExpense } from "@/hooks/crud";
import { useExpenseTypes } from "@/hooks/data";

export default function Update() {
    const { id } = useLocalSearchParams();  
    const [category, setCategory] = useState("");
    const [amount, setAmount] = useState("");
    const [currency, setCurrency] = useState("");
    const [day, setDay] = useState("");
    const [month, setMonth] = useState("");
    const [year, setYear] = useState("");
    const {data: types, loading} = useExpenseTypes();


    const router = useRouter();
    const {colorScheme, setColorScheme, theme} = useContext(ThemeContext)
    const [loaded, error] = useFonts({        
        Inter_500Medium,
    })

    const update = useUpdateExpense();
    
    useEffect(() => {
        if (!loading && types.length > 0) {
        setCategory(types[0]);
        }
    }, [loading, types]);
    
    if (!loaded && !error) {
        return null
    }

    if (loading) {
        return <ActivityIndicator style={{ flex: 1 }} />;
    }

    const updateExpense = async () => {
        if (!category || !amount || !currency || !day || !month || !year) {
            alert("Please fill out all fields");
            return;
        }

        const dt = new Date(
            Number(year),
            Number(month) - 1,
            Number(day)
        );

        const isoDate = dt.toISOString();
        
        update({
            id,
            category,
            amount: parseFloat(amount),
            currency,
            time: isoDate,
        });
    }

    const styles = createStyles(theme, colorScheme);
    // Screen
    return (
        <>
        <ThemedView style={styles.container}>
            <ThemedText type="label">Category</ThemedText>
            <View style={styles.pickerWrapper}>
                <Picker
                    enable={!loading}
                    selectedValue={category}
                    onValueChange={setCategory}
                    style={styles.picker}
                >
                {loading
                    ? <Picker.Item label="Loading…" value="" />
                    : types.map(t => <Picker.Item key={t} label={t} value={t} />)
                }
                </Picker>
            </View>

            <ThemedText type="label">Amount</ThemedText>
            <TextInput
                style={styles.input}
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
            />


            <ThemedText type="label">Currency</ThemedText>
            <TextInput
                style={styles.input}
                placeholder="USD"
                value={currency}
                onChangeText={setCurrency}
                maxLength={3}
            />

            <ThemedText type="label">Date (DD / MM / YYYY)</ThemedText>
            <View style={styles.dateRow}>
                <TextInput
                    style={[styles.input, styles.dateInput]}
                    placeholder="DD"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={day}
                    onChangeText={setDay}
                />
                <Text style={styles.dateSep}>/</Text>
                <TextInput
                    style={[styles.input, styles.dateInput]}
                    placeholder="MM"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={month}
                    onChangeText={setMonth}
                />
                <Text style={styles.dateSep}>/</Text>
                <TextInput
                    style={[styles.input, styles.dateYearInput]}
                    placeholder="YYYY"
                    keyboardType="number-pad"
                    maxLength={4}
                    value={year}
                    onChangeText={setYear}
                />
            </View>


            <Button 
                title="Save" 
                onPress={updateExpense} 
                style = {styles.saveButton}
            />
            <Button 
                title="Dashboard" 
                onPress={() => router.push('/tabs/home_page')} 
                style = {styles.saveButton}
            />
        </ThemedView>
        </>
    );
}

