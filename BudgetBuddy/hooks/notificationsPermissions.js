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
