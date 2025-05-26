import React, { useContext, useState, useEffect } from 'react';
import { Button, ActivityIndicator, Text, FlatList, View, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Picker } from "@react-native-picker/picker";
import createStyles from "./style";
import { Inter_500Medium, useFonts } from "@expo-google-fonts/inter";
import { ThemeContext } from "@/context/ThemeContext";
import { useExpenses, useCurrencyTypes } from "@/hooks/data";
import { useDeleteExpense } from '@/hooks/crud';

export default function AllExpenses() {
    const { cur } = useLocalSearchParams();  
    const router = useRouter();
    const {colorScheme, setColorScheme, theme} = useContext(ThemeContext)
    const [loaded, error] = useFonts({        
        Inter_500Medium,
    })  
    const {data: Expenses, loading: load1} = useExpenses({currency: cur});
    const deleteExpense = useDeleteExpense();
    const {data: currency_types, loading: load2} = useCurrencyTypes();
    const [currency, setCurrency] = useState("");
    if (!loaded && !error) {
        return null
    }

    const styles = createStyles(theme, colorScheme);

    if (load1) {
        return <ActivityIndicator style={{ flex: 1 }} />;
    }
    
    const renderItem = ({item}) => {
        const formattedDate = new Date(item.time).toLocaleDateString('en-GB');
        return (
            <View style={styles.row}>
                <Text style={{fontSize:18, color: 'red', width:"75%", overflow:true}} onPress={() => router.push({
                        pathname: '/personal_expenses/update',
                        params: { "id": item.id }
                        
                    })}>
                    {item.category=="Other" ? item.optional_cat : item.category}: {item.amount} {item.currency} at {formattedDate}
                </Text>
                <Text 
                    style={{fontSize:18, color: 'red'}} 
                    onPress={() => deleteExpense({id: item.id})}
                >
                    Delete
                </Text>
            </View>

        );
    }

    const keyExtractor = (item, index) => index.toString();

    // Screen
    return (
        <>
        <ThemedView style={styles.container}>
            
            <ThemedText type="title"> All expenses </ThemedText>
            <View style={styles.pickerWrapper}>
                <Picker
                    enable={!load2}
                    selectedValue={currency}
                    onValueChange={setCurrency}
                    style={styles.picker}
                >
                <Picker.Item
                    label="Original"
                    value={null}
                    enabled={true}
                    color="#999"
                />
                {load2
                    ? <Picker.Item label="Loading…" value="" />
                    : currency_types.map(t => <Picker.Item key={t} label={t} value={t} />)
                }
                </Picker>

                <Button 
                    title="Change currency" 
                    onPress={() => currency == "" 
                        ? router.push('/personal_expenses/history')
                        : router.push({
                            pathname:'/personal_expenses/history',
                            params: {"cur": currency}
                        })
                    }
                    style = {styles.saveButton}
                />
            </View>

            <FlatList
                data={Expenses}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                showsVerticalScrollIndicator={false}
            />
            
            <Button 
                title="add" 
                onPress={() => router.replace('/personal_expenses/add')} 
                style = {styles.saveButton}
            />
            <Button 
                title="home" 
                onPress={() => router.replace('/tabs/home_page')} 
                style = {styles.saveButton}
            />
        </ThemedView>
        </>
    );
}

