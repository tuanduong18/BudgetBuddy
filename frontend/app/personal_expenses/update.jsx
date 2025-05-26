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
import { useExpenseForm } from "@/hooks/expenseForm";

export default function UpdateExpense() {
    const { id } = useLocalSearchParams();
    const update = useUpdateExpense();  
    const {
        category, setCategory,
        optional_cat, setOptionalCat,
        amount,   setAmount,
        currency, setCurrency,
        description, setDescription,
        day,      setDay,
        month,    setMonth,
        year,     setYear,
        expense_types, currency_types,
        load1, load2,
        submit: updateExpense,
    } = useExpenseForm(update, id);

    const router = useRouter();
    const {colorScheme, setColorScheme, theme} = useContext(ThemeContext)
    const [loaded, error] = useFonts({        
        Inter_500Medium,
    })    
    
    if (!loaded && !error) {
        return null
    }

    if (load1 || load2) {
        return <ActivityIndicator style={{ flex: 1 }} />;
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

            <ThemedText type="label">Optional category</ThemedText>
            <TextInput
                style={styles.input}
                placeholder="Additional information to category"
                value={optional_cat}
                onChangeText={setOptionalCat}
                maxLength={30}
            />
                

            <ThemedText type="label">Amount</ThemedText>
            <TextInput
                style={styles.input}
                placeholder="0.00"
                value={amount}
                keyboardType="decimal-pad"
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

            <ThemedText type="label">Description</ThemedText>
            <TextInput
                style={styles.input}
                placeholder="e.g: Buy ChatGPT Plus"
                value={description}
                onChangeText={setDescription}
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
                title="Back" 
                onPress={() => router.replace('/personal_expenses/history')} 
                style = {styles.saveButton}
            />
        </ThemedView>
        </>
    );
}

