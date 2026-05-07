import path from "path";
import { v4 as uuidv4 } from "uuid";
import { bucket } from "../config/firebase.js";

export const uploadVideoToFirebase = async (file) => {
  try {
    const fileName = `videos/${uuidv4()}${path.extname(
      file.originalname
    )}`;

    const firebaseFile = bucket.file(fileName);

    await firebaseFile.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
      },
    });

    await firebaseFile.makePublic();

    return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  } catch (error) {
    console.error("Video upload error:", error);
    throw error;
  }
};