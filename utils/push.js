import { Expo } from "expo-server-sdk";
import { messaging } from "../config/firebase.js";

const expo = new Expo();

export const sendPushNotification = async (
  agentData,
  payload
) => {
  try {
    // ==========================
    // 🍎 iOS → Expo Push
    // ==========================
    if (
      agentData.platform === "ios" &&
      agentData.expoPushToken
    ) {
      if (
        !Expo.isExpoPushToken(
          agentData.expoPushToken
        )
      ) {
        console.log("Invalid Expo token");
        return;
      }

      await expo.sendPushNotificationsAsync([
        {
          to: agentData.expoPushToken,

          sound: "ringtone.wav",

          title: payload.title,

          body: payload.body,

          priority: "high",

          data: {
            type: "incoming_request",

            requestId: String(
              payload.data.requestId
            ),

            agentId: String(
              payload.data.agentId
            ),

            clientId: String(
              payload.data.clientId
            ),

            clientName:
              payload.data.clientName || "",

            propertyType:
              payload.data.propertyType || "",

            lat: String(payload.data.lat || ""),

            lng: String(payload.data.lng || ""),
          },
        },
      ]);

      console.log("iOS Push Sent");
    }

    // ==========================
    // 🤖 Android → FCM Push
    // ==========================
    if (
      agentData.platform === "android" &&
      agentData.fcmToken
    ) {
      console.log(
        "Sending Android Push:",
        agentData.fcmToken
      );

      const response = await messaging.send({
        token: agentData.fcmToken,

        // ✅ visible notification
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: "",
        },

        // ✅ android config
        android: {
          priority: "high",

          notification: {
            channelId: "requests_v2",

            sound: "ringtone",

            priority: "max",

            defaultVibrateTimings: true,

            visibility: "public",
          },
        },

        // ✅ custom payload
        data: {
          type: "incoming_request",

          title: payload.title,

          body: payload.body,

          requestId: String(
            payload.data.requestId
          ),

          agentId: String(
            payload.data.agentId
          ),

          clientId: String(
            payload.data.clientId
          ),

          clientName:
            payload.data.clientName || "",

          propertyType:
            payload.data.propertyType || "",

          lat: String(payload.data.lat || ""),

          lng: String(payload.data.lng || ""),
        },
      });

      console.log(
        "Android Push Sent:",
        response
      );
    }
  } catch (error) {
    console.error("Push error:", error);
  }
};