import React, { useContext } from 'react';
import { Button, ActivityIndicator, Text, FlatList, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import createStyles from "./style";
import { Inter_500Medium, useFonts } from "@expo-google-fonts/inter";
import { ThemeContext } from "@/context/ThemeContext";
import { useExpenses } from "@/hooks/data";
import { useDeleteExpense } from '@/hooks/crud';

export default function AllExpenses() {  
    const router = useRouter();
    const {colorScheme, setColorScheme, theme} = useContext(ThemeContext)
    const [loaded, error] = useFonts({        
        Inter_500Medium,
    })  
    const {data: Expenses, loading: load1} = useExpenses();
    const deleteExpense = useDeleteExpense();

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
                <Text style={{fontSize:18, color: 'red'}}>
                    {item.category}: {item.amount} {item.currency} at {formattedDate}
                </Text>
                <Text style={{fontSize:18, color: 'red'}}><Pressable 
                    onPress={() => router.push({
                        pathname: '/personal_expenses/update',
                        params: { "id": item.id }
                    })}
                >
                    Update
                </Pressable>
                </Text>
                <Text style={{fontSize:18, color: 'red'}}><Pressable 
                    onPress={() => deleteExpense({id: item.id})}
                >
                    Delete
                </Pressable>
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
            <FlatList
                data={Expenses}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
            />
            <Button 
                title="add" 
                onPress={() => router.push('/personal_expenses/add')} 
                style = {styles.saveButton}
            />
            <Button 
                title="home" 
                onPress={() => router.push('/tabs/home_page')} 
                style = {styles.saveButton}
            />
        </ThemedView>
        </>
    );
}

