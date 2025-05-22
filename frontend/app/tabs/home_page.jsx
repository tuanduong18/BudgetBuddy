import React, { useContext } from 'react';
import { Button, ActivityIndicator, Text, FlatList, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import createStyles from "./style";
import { Inter_500Medium, useFonts } from "@expo-google-fonts/inter";
import { ThemeContext } from "@/context/ThemeContext";
import { useSignOut } from "@/hooks/auth";
import { useUsername, useExpenses } from "@/hooks/data";
import { useDeleteExpense } from '@/hooks/crud';

export default function NotFoundScreen() {  
    const router = useRouter();
    const {colorScheme, setColorScheme, theme} = useContext(ThemeContext)
    const [loaded, error] = useFonts({        
        Inter_500Medium,
    })  
    const {data: username, loading: load1} = useUsername();
    const {data: Expenses, loading: load2} = useExpenses();
    const signOut = useSignOut();
    const deleteExpense = useDeleteExpense();

    if (!loaded && !error) {
        return null
    }

    const styles = createStyles(theme, colorScheme);

    if (load1 || load2) {
        return <ActivityIndicator style={{ flex: 1 }} />;
    }

    if (!username) {
        return <Text style={{ padding: 20 }}>No data</Text>;
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
                        pathname: '/tabs/update',
                        params: { "id": item.id }
                    })}
                >
                    Update
                </Pressable>
                </Text>
                <Text style={{fontSize:18, color: 'red'}}><Pressable 
                    onPress={() => deleteExpense(item.id)}
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
            <ThemedText type="title">Welcome, {username} </ThemedText>
            <FlatList
                data={Expenses}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
            />
            <Button 
                title="add" 
                onPress={() => router.push('/tabs/add')} 
                style = {styles.saveButton}
            />
            <Button 
                title="Sign out" 
                onPress={() => signOut()} 
                style = {styles.saveButton}
            />
        </ThemedView>
        </>
    );
}

