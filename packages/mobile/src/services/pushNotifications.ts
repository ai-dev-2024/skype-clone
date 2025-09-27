import PushNotification from 'react-native-push-notification';
import messaging from '@react-native-firebase/messaging';
import {Platform} from 'react-native';

class PushNotificationService {
  private initialized = false;

  initialize() {
    if (this.initialized) return;

    // Configure local notifications
    PushNotification.configure({
      onRegister: (token) => {
        console.log('Push notification token:', token);
        // Send token to backend
        this.sendTokenToBackend(token.token);
      },

      onNotification: (notification) => {
        console.log('Notification received:', notification);

        // Handle notification when app is in foreground
        if (notification.foreground) {
          this.showLocalNotification(notification);
        }
      },

      onAction: (notification) => {
        console.log('Action received:', notification.action);
      },

      onRegistrationError: (err) => {
        console.error('Registration error:', err.message, err);
      },

      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      popInitialNotification: true,
      requestPermissions: true,
    });

    // Configure Firebase messaging for Android
    if (Platform.OS === 'android') {
      this.setupFirebaseMessaging();
    }

    this.initialized = true;
  }

  private setupFirebaseMessaging() {
    // Request permission
    messaging().requestPermission().then((authStatus) => {
      console.log('Authorization status:', authStatus);
    });

    // Get FCM token
    messaging().getToken().then((token) => {
      console.log('FCM token:', token);
      this.sendTokenToBackend(token);
    });

    // Handle token refresh
    messaging().onTokenRefresh((token) => {
      console.log('FCM token refreshed:', token);
      this.sendTokenToBackend(token);
    });

    // Handle incoming messages when app is in foreground
    messaging().onMessage(async (remoteMessage) => {
      console.log('FCM message received:', remoteMessage);
      this.showLocalNotification(remoteMessage);
    });

    // Handle notification opened from background/quit state
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened from background:', remoteMessage);
      // Navigate to appropriate screen
    });

    // Handle initial notification
    messaging().getInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        console.log('Notification opened from quit state:', remoteMessage);
        // Navigate to appropriate screen
      }
    });
  }

  private async sendTokenToBackend(token: string) {
    try {
      // Send token to backend to enable push notifications
      const response = await fetch('/api/users/device-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers
        },
        body: JSON.stringify({
          token,
          platform: Platform.OS,
        }),
      });

      if (response.ok) {
        console.log('Device token sent to backend successfully');
      } else {
        console.error('Failed to send device token to backend');
      }
    } catch (error) {
      console.error('Error sending device token:', error);
    }
  }

  showLocalNotification(notification: any) {
    const {title, message, data} = notification;

    PushNotification.localNotification({
      title: title || 'Skype Clone',
      message: message || 'You have a new message',
      playSound: true,
      soundName: 'default',
      userInfo: data || {},
      channelId: 'default-channel',
    });
  }

  showMessageNotification(chatName: string, senderName: string, message: string, chatId: string) {
    PushNotification.localNotification({
      title: chatName,
      message: `${senderName}: ${message}`,
      playSound: true,
      soundName: 'default',
      userInfo: {chatId, type: 'message'},
      channelId: 'messages',
    });
  }

  showCallNotification(callerName: string, callId: string) {
    PushNotification.localNotification({
      title: 'Incoming Call',
      message: `${callerName} is calling you`,
      playSound: true,
      soundName: 'default',
      userInfo: {callId, type: 'call'},
      channelId: 'calls',
      actions: ['ANSWER', 'DECLINE'],
    });
  }

  createNotificationChannels() {
    PushNotification.createChannel(
      {
        channelId: 'default-channel',
        channelName: 'Default Channel',
        channelDescription: 'Default notification channel',
        playSound: true,
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`Default channel created: ${created}`)
    );

    PushNotification.createChannel(
      {
        channelId: 'messages',
        channelName: 'Messages',
        channelDescription: 'Message notifications',
        playSound: true,
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`Messages channel created: ${created}`)
    );

    PushNotification.createChannel(
      {
        channelId: 'calls',
        channelName: 'Calls',
        channelDescription: 'Call notifications',
        playSound: true,
        soundName: 'default',
        importance: 5,
        vibrate: true,
      },
      (created) => console.log(`Calls channel created: ${created}`)
    );
  }

  cancelAllNotifications() {
    PushNotification.cancelAllLocalNotifications();
  }

  cancelNotification(notificationId: string) {
    PushNotification.cancelLocalNotifications({id: notificationId});
  }

  getScheduledNotifications() {
    return PushNotification.getScheduledLocalNotifications((notifications) => {
      console.log('Scheduled notifications:', notifications);
    });
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
