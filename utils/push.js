import { Expo } from "expo-server-sdk";
import admin from "firebase-admin";

const expo = new Expo();

export async function sendPushNotification(notification, payload) {
  try {
    // 🔵 PRIORITY: FCM (Android + iOS production)
    if (notification?.fcmToken) {
      console.log("🔵 Sending via FCM");

      await admin.messaging().send({
        token: notification.fcmToken,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
        android: { priority: "high" },
        apns: {
          payload: { aps: { sound: "default" } },
        },
      });

      return;
    }

    // 🟣 FALLBACK: EXPO (Expo Go / Dev Client)
    if (
      notification?.expoToken &&
      Expo.isExpoPushToken(notification.expoToken)
    ) {
      console.log("🟣 Sending via EXPO");

      await expo.sendPushNotificationsAsync([
        {
          to: notification.expoToken,
          sound: "default",
          title: payload.title,
          body: payload.body,
          data: payload.data,
          priority: "high",
        },
      ]);

      return;
    }

    console.log("⚠️ No valid push token found");
  } catch (err) {
    console.error("❌ Push send error:", err.message);
    throw err;
  }
}
