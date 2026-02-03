import { Expo } from "expo-server-sdk";
import admin from "firebase-admin";

const expo = new Expo();

export async function sendPushNotification(token, payload) {
  try {
    // 🟣 EXPO PUSH TOKEN
    if (Expo.isExpoPushToken(token)) {
      console.log("🟣 Sending via EXPO");

      const messages = [
        {
          to: token,
          sound: "default",
          title: payload.title,
          body: payload.body,
          data: payload.data,
          priority: "high",
          channelId: "default",
        },
      ];

      const ticketChunk = await expo.sendPushNotificationsAsync(messages);
      console.log("🟣 Expo push response:", ticketChunk);
      return;
    }

    // 🔵 FCM TOKEN (Android or iOS Firebase builds)
    console.log("🔵 Sending via FCM");

    await admin.messaging().send({
      token: token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      android: {
        priority: "high",
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    });

    console.log("🔵 FCM push sent successfully");
  } catch (error) {
    console.error("❌ Push send error:", error.message);
    throw error;
  }
}
