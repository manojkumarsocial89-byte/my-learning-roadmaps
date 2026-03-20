// db.js
import { db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const PROGRESS_COLLECTION = "user_progress";

export const saveProgress = async (userId, data) => {
  if (!userId) return;
  try {
    const userDoc = doc(db, PROGRESS_COLLECTION, userId);
    await setDoc(userDoc, data, { merge: true });
    console.log("Progress saved to Firestore");
  } catch (error) {
    console.error("Error saving progress:", error);
  }
};

export const fetchProgress = async (userId) => {
  if (!userId) return null;
  try {
    const userDoc = doc(db, PROGRESS_COLLECTION, userId);
    const docSnap = await getDoc(userDoc);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching progress:", error);
    return null;
  }
};

export const syncLocalStorageWithFirestore = async (userId) => {
  const cloudData = await fetchProgress(userId);
  if (cloudData) {
    Object.keys(cloudData).forEach((key) => {
      // Merge logic: prefer cloud data or local data?
      // Usually, cloud is source of truth for logged in users.
      localStorage.setItem(key, JSON.stringify(cloudData[key]));
    });
    return true;
  }
  return false;
};
