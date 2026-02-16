import { Expo } from "expo-server-sdk";
import { messaging } from "../config/firebase.js";

const expo = new Expo();

export const sendPushNotification = async (agentData, payload) => {
  try {
    // ==========================
    // 📱 iOS → Expo Push
    // ==========================
    if (agentData.platform === "ios" && agentData.expoPushToken) {
      if (!Expo.isExpoPushToken(agentData.expoPushToken)) {
        console.log("Invalid Expo token");
        return;
      }

      await expo.sendPushNotificationsAsync([
        {
          to: agentData.expoPushToken,
          sound: "default",
          title: payload.title,
          body: payload.body,
          data: payload.data,
          priority: "high",
        },
      ]);

      console.log("iOS Push Sent");
    }

    // ==========================
    // 🤖 Android → FCM Push
    // ==========================
    if (agentData.platform === "android" && agentData.fcmToken) {
      await messaging.send({
        token: agentData.fcmToken,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: {
          requestId: String(payload.data.requestId),
          lat: String(payload.data.lat),
          lng: String(payload.data.lng),
        },
        android: {
          priority: "high",
        },
      });

      console.log("Android Push Sent");
    }
  } catch (error) {
    console.error("Push error:", error);
  }
};