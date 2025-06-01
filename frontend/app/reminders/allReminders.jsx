import React, { useContext, useState, useEffect } from 'react';
import { Button, ActivityIndicator, Text, FlatList, View, Pressable, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import createStyles from "./style";
import { Inter_500Medium, useFonts } from "@expo-google-fonts/inter";
import { ThemeContext } from "@/context/ThemeContext";
import { useSubscriptions } from '@/hooks/data';
import { useDeleteSubscription } from '@/hooks/reminder';
import * as Notifications from 'expo-notifications';

export default function AllReminders() {
    useEffect(() => {
    (async () => {
        const all = await Notifications.getAllScheduledNotificationsAsync();
        console.log('All scheduled notifications:', all);
    })();
  }, []);

    const router = useRouter();
    const deleteSubs = useDeleteSubscription();
    const {colorScheme, setColorScheme, theme} = useContext(ThemeContext)
    const [loaded, error] = useFonts({        
        Inter_500Medium,
    })  

    const {data: Subscriptions, loading} = useSubscriptions();

    if (!loaded && !error) {
        return null
    }

    if (loading) {
        return <ActivityIndicator style={{ flex: 1 }} />;
    }

    const styles = createStyles(theme, colorScheme);
    
    const renderItem = ({item}) => {
        const formattedDate = new Date(item.end_time).toLocaleDateString('en-GB');
        return (
            <View style={styles.row}>
                <Text style={{fontSize:18, color: 'red', width:"75%"}} onPress={() => router.push({
                        pathname: '/reminders/update',
                        params: { "id": item.id }    
                    })}>
                    {item.name} expired at {formattedDate}
                </Text>
                <Text 
                    style={{fontSize:18, color: 'red'}} 
                    onPress={async () =>   deleteSubs({id: item.id, noti_id: item.noti_id})}
                    
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
        <View style={styles.container}>
            
            <Text type="title"> All Subscriptions </Text>

            <FlatList
                data={Subscriptions}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                showsVerticalScrollIndicator={false}
            />
            
            <Button 
                title="add" 
                onPress={() => router.replace('/reminders/add')} 
                style = {styles.saveButton}
            />
            <Button 
                title="home" 
                onPress={() => router.replace('/tabs/home_page')} 
                style = {styles.saveButton}
            />
        </View>
        </>
    );
}

