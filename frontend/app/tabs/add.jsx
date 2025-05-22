import React, { useContext, useState, useEffect } from 'react';
import { Button, ActivityIndicator, TextInput, View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Picker } from "@react-native-picker/picker";
import createStyles from "./style";
import { Inter_500Medium, useFonts } from "@expo-google-fonts/inter";
import { ThemeContext } from "@/context/ThemeContext";
import { useAddExpense } from "@/hooks/crud";
import { useExpenseTypes, useCurrencyTypes } from "@/hooks/data";

export default function Add() {  
    const [category, setCategory] = useState("");
    const [amount, setAmount] = useState("");
    const [currency, setCurrency] = useState("");
    const [day, setDay] = useState("");
    const [month, setMonth] = useState("");
    const [year, setYear] = useState("");
    const {data: expense_types, loading: load1} = useExpenseTypes();
    const {data: currency_types, loading: load2} = useCurrencyTypes();


    const router = useRouter();
    const {colorScheme, setColorScheme, theme} = useContext(ThemeContext)
    const [loaded, error] = useFonts({        
        Inter_500Medium,
    })

    const add = useAddExpense();
    
    useEffect(() => {
        if (!load1 && expense_types.length > 0) {
        setCategory(expense_types[0]);
        }
    }, [load1, expense_types]);

    useEffect(() => {
        if (!load1 && currency_types.length > 0) {
        setCurrency(currency_types[0]);
        }
    }, [load2, currency_types]);
    
    if (!loaded && !error) {
        return null
    }

    if (load1 || load2) {
        return <ActivityIndicator style={{ flex: 1 }} />;
    }

    const addExpense = async () => {
        if (!category || !amount || !currency || !day || !month || !year) {
            Alert.alert("Please fill out all fields");
            return;
        }

        const dt = new Date(
            Number(year),
            Number(month) - 1,
            Number(day)
        );

        const isoDate = dt.toISOString();
        
        add({
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
                    enable={!load1}
                    selectedValue={category}
                    onValueChange={setCategory}
                    style={styles.picker}
                >
                {load1
                    ? <Picker.Item label="Loading…" value="" />
                    : expense_types.map(t => <Picker.Item key={t} label={t} value={t} />)
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
            <View style={styles.pickerWrapper}>
                <Picker
                    enable={!load2}
                    selectedValue={currency}
                    onValueChange={setCurrency}
                    style={styles.picker}
                >
                {load2
                    ? <Picker.Item label="Loading…" value="" />
                    : currency_types.map(t => <Picker.Item key={t} label={t} value={t} />)
                }
                </Picker>
            </View>

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
                onPress={addExpense} 
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

