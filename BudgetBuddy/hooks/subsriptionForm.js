/**
 * Subscription/reminder form state management hook.
 *
 * Handles both creation and update flows for subscription reminders.
 * During submission, a local push notification is scheduled to fire at
 * 9 AM one day before the subscription's end_time, alerting the user to
 * an upcoming renewal or expiry.
 *
 * If an existing notification ID (`noti_id`) is present (i.e. update flow),
 * the old notification is cancelled before the new one is scheduled, so
 * there is always at most one active notification per subscription.
 *
 * @param {Function}    func - The CRUD action callback (useAddSubscription or useUpdateSubscription).
 * @param {number|null} id   - Subscription ID for updates, or null for new entries.
 */
import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { useUpdatingSubs } from "./data";
import * as Notifications from 'expo-notifications';

export function useSubscriptionForm(func, id = null) {
    // Form state
    const [noti_id, setNoti_id]     = useState("");
    const [name, setName]           = useState("");
    const [start_time, setStartTime] = useState(new Date());
    const [end_time, setEndTime]    = useState(new Date());

    /** Validate that the description is non-empty and end > start. */
    async function validateBeforeScheduling() {
        if (!name.trim()) {
            Alert.alert("Description cannot be empty");
            return false;
        }

        if (end_time.getTime() - start_time.getTime() < 0) {
            Alert.alert('End time must be later than start time');
            return false;
        }
        return true;
    }

    // Request notification permissions on mount.
    useEffect(() => {
        (async () => {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Notifications disabled', 'Please enable notifications in settings');
            }
        })();
    }, []);

    // Initialise defaults based on whether we are creating or editing.
    if (id == null) {
        const today = new Date();
        const in28Days = new Date(today);
        in28Days.setDate(today.getDate() + 28);
        useEffect(() => {
            setStartTime(today);
            setEndTime(in28Days);
        }, []);
    } else {
        // Pre-populate from the existing subscription being edited.
        const { data: subs, loading: load3 } = useUpdatingSubs({ id });
        useEffect(() => {
            if (!load3) {
                setNoti_id(subs.noti_id);
                setName(subs.name);
                setStartTime(new Date(subs.start_time));
                setEndTime(new Date(subs.end_time));
            }
        }, [load3, subs]);
    }

    /**
     * Validate, schedule a local notification 1 day before end_time at 9 AM,
     * then delegate to the CRUD action callback.
     */
    const submit = async () => {
        const valid = await validateBeforeScheduling();
        if (!valid) return;

        // Calculate the exact number of seconds between now and 9 AM the day
        // before expiration so we can use a TIME_INTERVAL trigger.
        const now = new Date();
        const notifyDate = new Date(end_time.getTime());
        notifyDate.setDate(end_time.getDate() - 1);
        notifyDate.setHours(9, 0, 0, 0);
        const diffMs = notifyDate.getTime() - now.getTime();
        const secondsUntil = Math.max(Math.ceil(diffMs / 1000), 1);

        let newId;

        if (!noti_id) {
            // First time — schedule a brand-new notification.
            newId = await Notifications.scheduleNotificationAsync({
                content: { title: 'Hey!', body: `${name} is expiring in 1 day` },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: secondsUntil,
                    repeats: false,
                },
            });
        } else {
            // Update — cancel the old notification, then schedule a new one.
            await Notifications.cancelScheduledNotificationAsync(noti_id);
            newId = await Notifications.scheduleNotificationAsync({
                content: { title: 'Hey!', body: `${name} is expiring in 1 day` },
                trigger: {
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
        // Form state + setters
        name,       setName,
        start_time, setStartTime,
        end_time,   setEndTime,

        // Submit handler
        submit,
    };
}
