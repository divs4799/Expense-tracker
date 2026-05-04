import { useState, useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../storage/firebase';

// NOTE: You must generate a Web Push certificate key pair (VAPID key)
// from the Firebase Console -> Project Settings -> Cloud Messaging -> Web configuration
const VAPID_KEY = "YOUR_VAPID_KEY_HERE";

export function useFCM() {
  const [fcmToken, setFcmToken] = useState(null);
  const [permissionState, setPermissionState] = useState(Notification.permission);

  const requestPermissionAndGetToken = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);

      if (permission === 'granted') {
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (token) {
          setFcmToken(token);
          return token;
        } else {
          console.warn('No registration token available. Request permission to generate one.');
          return null;
        }
      } else {
        console.warn('Notification permission not granted.');
        return null;
      }
    } catch (error) {
      console.error('An error occurred while retrieving token. ', error);
      return null;
    }
  };

  useEffect(() => {
    if (permissionState === 'granted') {
      requestPermissionAndGetToken();
    }
    
    // Foreground message listener
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received in foreground: ', payload);
      // We could optionally show a toast here if we want an in-app alert too
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [permissionState]);

  return {
    fcmToken,
    permissionState,
    requestPermissionAndGetToken
  };
}
