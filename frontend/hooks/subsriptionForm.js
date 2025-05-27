import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { useUpdatingSubs } from "./data";
import * as Notifications from 'expo-notifications';

export function useSubscriptionForm(func, id = null) {
    // 1. form state
    const [noti_id, setNoti_id]     = useState("");
    const [name, setName]           = useState("");
    const [sday, setsDay]           = useState("");
    const [smonth, setsMonth]       = useState("");
    const [syear, setsYear]         = useState("");
    const [eday, seteDay]           = useState("");
    const [emonth, seteMonth]       = useState("");
    const [eyear, seteYear]         = useState("");


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
            setsDay((today.getDate()).toString());
            setsMonth((today.getMonth() + 1).toString());
            setsYear((today.getFullYear()).toString());
            seteDay((in28Days.getDate()).toString());
            seteMonth((in28Days.getMonth() + 1).toString());
            seteYear((in28Days.getFullYear()).toString());
        },[]);
    } else {
        const {data: subs, loading: load3} = useUpdatingSubs({id: id});
        useEffect(() => {
            if (!load3) {
                setNoti_id(subs.noti_id);
                setName(subs.name);
                const start_time = new Date(subs.start_time);
                setsDay((start_time.getDate()).toString());
                setsMonth((start_time.getMonth() + 1).toString());
                setsYear((start_time.getFullYear()).toString());
                const end_time = new Date(subs.end_time);
                seteDay((end_time.getDate()).toString());
                seteMonth((end_time.getMonth() + 1).toString());
                seteYear((end_time.getFullYear()).toString());
            }
        }, [load3, subs]);
    }
    // 4. validate + submit
    const submit = async () => {
        // all required fields filled?
        if (![name, sday, smonth, syear, eday, emonth, eyear].every(Boolean)) {
            return Alert.alert("Please fill out all compulsory fields");
        }
        
        // build date
        const sdt = new Date(+syear, +smonth - 1, +sday+1);
        const edt = new Date(+eyear, +emonth - 1, +eday+1);
        const target = new Date(+eyear, +emonth - 1, +eday, 9, 0, 0)
        const diffMs  = target.getTime() - Date.now();
        const diffsec =  Math.max(Math.floor(diffMs / 1000), 0) + 1;
        if (isNaN(sdt.getTime()) || isNaN(edt.getTime())) {
            return Alert.alert("Invalid date");
        }

        let newId;
        if (!noti_id) {
            newId = await Notifications.scheduleNotificationAsync({
                content: { title: 'Hey!', body: `${name} is expiring in 1 day` },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: diffsec,
                    repeats: false,
                },
            });
        } else {
            await Notifications.cancelScheduledNotificationAsync(noti_id); 
            newId = await Notifications.scheduleNotificationAsync({
                content: { title: 'Hey!', body: `${name} is expiring in 1 day` },
                trigger:  { 
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: diffsec,
                    repeats: false, 
                },
            });
        }

        await func({
            id,
            noti_id: newId,
            name, 
            start_time: sdt.toISOString(),
            end_time: edt.toISOString(),
        });
    };

    return {
        // state + setters
        name,      setName,
        sday,      setsDay,
        smonth,    setsMonth,
        syear,     setsYear,
        eday,      seteDay,
        emonth,    seteMonth,
        eyear,     seteYear,

        // submit fn
        submit,
    };
}