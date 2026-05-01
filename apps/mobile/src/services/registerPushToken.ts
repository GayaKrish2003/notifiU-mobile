import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api from './api';

export const registerPushToken = async () => {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Push notification permission denied');
            return;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
        });
        const pushToken = tokenData.data;

        await api.post('/users/push-token', { pushToken });
        console.log('Push token registered:', pushToken);

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                sound: 'default',
            });
        }
    } catch (err) {
        console.log('Push notifications not supported in this environment');
    }
};