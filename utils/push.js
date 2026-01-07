import { Expo } from "expo-server-sdk";

const expo = new Expo();

export async function sendPushNotification(pushToken, payload) {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.log("Invalid Expo push token");
    return;
  }

  const messages = [
    {
      to: pushToken,
      sound: "default", // 🔊 Uber-style sound
      title: payload.title,
      body: payload.body,
      data: payload.data,
      priority: "high",
    },
  ];

  try {
    await expo.sendPushNotificationsAsync(messages);
  } catch (error) {
    console.error("Push error:", error);
  }
}
