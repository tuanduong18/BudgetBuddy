/**
 * Push-notification permission helper.
 *
 * Called once at app launch (app/index.jsx) to request OS-level notification
 * permissions.  On iOS, requesting permissions is mandatory before any local
 * notification can be scheduled.  On Android 13+ (API 33), the POST_NOTIFICATIONS
 * runtime permission is also required.
 *
 * @returns {Promise<boolean>} `true` if permissions are granted, `false` otherwise.
 */
import * as Notifications from 'expo-notifications';

export async function requestPermissions() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const { status: newStatus } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    if (newStatus !== 'granted') {
      console.warn('Notification permissions denied');
      return false;
    }
  }
  return true;
}
