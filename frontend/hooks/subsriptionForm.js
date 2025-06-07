import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { useUpdatingSubs } from "./data";
import * as Notifications from 'expo-notifications';

export function useSubscriptionForm(func, id = null) {
    // 1. form state
    const [noti_id, setNoti_id]     = useState("");
    const [name, setName]           = useState("");
    const [start_time, setStartTime]= useState(new Date());
    const [end_time, setEndTime]    = useState(new Date());

    async function validateBeforeScheduling() {
        if (!name.trim()) {
            Alert.alert("Description cannot be empty");
            return false;
        }

        if (end_time.getTime() - start_time.getTime() < 0){
            Alert.alert('End time must be later than start time');
            return false;
        }
    }

    useEffect(() => {
    (async () => {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Notifications disabled', 'Please enable notifications in settings');
        }
        })();
    }, []);

    // 3. set defaults when loaded
    if(id == null){
        const today = new Date()
        const in28Days = new Date(today);
        in28Days.setDate(today.getDate() + 28);
        useEffect(() => {
            setStartTime(today)
            setEndTime(in28Days)
        },[]);
    } else {
        const {data: subs, loading: load3} = useUpdatingSubs({id: id});
        useEffect(() => {
            if (!load3) {
                setNoti_id(subs.noti_id);
                setName(subs.name);
                setStartTime(new Date(subs.start_time));
                setEndTime(new Date(subs.end_time));
            }
        }, [load3, subs]);
    }

    // 4. validate + submit
    const submit = async () => {
        // Block to check before creating push notification
        const valid = await validateBeforeScheduling();
        if (!valid) {
            return;
        }

        // Create exact time interval so that the notification fires at 9 am local time 1 day before expiration
        const now = new Date();
        const newDate = new Date(end_time.getTime());
        newDate.setDate(end_time.getDate() - 1)
        newDate.setHours(9, 0, 0, 0);
        const diffMs = newDate.getTime() - now.getTime();
        const secondsUntil = Math.max(Math.ceil(diffMs / 1000), 1);

        let newId;
        
        if (!noti_id) {
            newId = await Notifications.scheduleNotificationAsync({
                content: { title: 'Hey!', body: `${name} is expiring in 1 day` },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: secondsUntil,
                    repeats: false,
                },
            });
        } else {
            await Notifications.cancelScheduledNotificationAsync(noti_id); 
            newId = await Notifications.scheduleNotificationAsync({
                content: { title: 'Hey!', body: `${name} is expiring in 1 day` },
                trigger:  { 
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: secondsUntil,
                    repeats: false, 
                },
            });
        }

        await func({
            id,
            noti_id: newId,
            name, 
            start_time: start_time.toISOString(),
            end_time: end_time.toISOString(),
        });
    };

    return {
        // state + setters
        name,       setName,
        start_time, setStartTime,
        end_time,   setEndTime,

        // submit fn
        submit,
    };
}

