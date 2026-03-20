import { db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const COLLECTION = "user_progress";

export const saveProgress = async (userId, data) => {
  if (!userId) return;
  try {
    await setDoc(doc(db, COLLECTION, userId), data, { merge: true });
  } catch (e) {
    console.error("saveProgress:", e);
  }
};

export const fetchProgress = async (userId) => {
  if (!userId) return null;
  try {
    const snap = await getDoc(doc(db, COLLECTION, userId));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.error("fetchProgress:", e);
    return null;
  }
};

/**
 * Copies Firestore data into localStorage.
 * KEY FIX: strings (e.g. theme = "dark") are stored directly,
 * not JSON.stringified — which would produce '"dark"' and break
 * setAttribute('data-theme', '"dark"').
 */
export const syncLocalStorageWithFirestore = async (userId) => {
  const cloud = await fetchProgress(userId);
  if (!cloud) return false;
  try {
    Object.entries(cloud).forEach(([key, value]) => {
      localStorage.setItem(
        key,
        typeof value === "string" ? value : JSON.stringify(value),
      );
    });
  } catch (e) {}
  return true;
};
