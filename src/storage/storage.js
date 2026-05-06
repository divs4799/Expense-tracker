import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile, 
  updateEmail, 
  updatePassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  onSnapshot,
  addDoc,
  serverTimestamp,
  arrayUnion
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { DEFAULT_CATEGORIES, CAT_COLORS } from "../constants/categories";

// ── Keys ────────────────────────────────────────────────────────────────────
export const KEYS = {
  theme: "fam_theme",
};

// ── Auth & Session ──────────────────────────────────────────────────────────

/** Get current user session from Firebase Auth */
export function getSession() {
  return auth.currentUser;
}

export async function getUserProfile(uid) {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      // Auto-create on fetch if missing (e.g. if the user deleted the collection)
      const user = auth.currentUser;
      if (user && user.uid === uid) {
        const avatarColor = CAT_COLORS[Math.floor(Math.random() * CAT_COLORS.length)];
        const profile = {
          uid: user.uid,
          name: user.displayName || "",
          email: (user.email || "").toLowerCase(),
          avatar: null,
          avatarColor,
          familyIds: [],
          activeFamilyId: null,
          createdAt: serverTimestamp()
        };
        await setDoc(doc(db, "users", user.uid), profile);
        return profile;
      }
    }
  } catch (e) {
    console.warn("Profile fetch failed:", e);
  }
  return null;
}

export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Fetch profile from Firestore, but don't crash if it fails
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        return { ok: true, user: { ...user, ...userDoc.data() } };
      } else {
        // Document missing (e.g., old account). Create one.
        const avatarColor = CAT_COLORS[Math.floor(Math.random() * CAT_COLORS.length)];
        const profile = {
          uid: user.uid,
          name: user.displayName || "",
          email: user.email.toLowerCase(),
          avatar: null,
          avatarColor,
          familyIds: [],
          activeFamilyId: null,
          createdAt: serverTimestamp()
        };
        await setDoc(doc(db, "users", user.uid), profile);
        return { ok: true, user: { ...user, ...profile } };
      }
    } catch (e) {
      console.warn("Profile fetch failed, using basic auth info:", e);
    }
    
    return { ok: true, user };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function registerUser(name, email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const avatarColor = CAT_COLORS[Math.floor(Math.random() * CAT_COLORS.length)];
    
    const profile = {
      uid: user.uid,
      name,
      email: email.toLowerCase(),
      avatar: null,
      avatarColor,
      familyIds: [],
      activeFamilyId: null,
      createdAt: serverTimestamp()
    };

    // Save profile to Firestore
    await setDoc(doc(db, "users", user.uid), profile);
    await updateProfile(user, { displayName: name });
    
    return { ok: true, user: { ...user, ...profile } };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function clearSession() {
  await signOut(auth);
}

export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

// ── User Management ─────────────────────────────────────────────────────────

export async function updateUserName(user, newName) {
  await setDoc(doc(db, "users", user.uid), { name: newName }, { merge: true });
  await updateProfile(auth.currentUser, { displayName: newName });
  return { ...user, name: newName };
}

export async function updateUserAvatar(user, avatar, avatarColor) {
  await setDoc(doc(db, "users", user.uid), { avatar, avatarColor }, { merge: true });
  return { ...user, avatar, avatarColor };
}

export async function updateUserEmail(user, newEmail, password) {
  try {
    // Note: re-authentication might be required by Firebase for sensitive changes
    await updateEmail(auth.currentUser, newEmail);
    await setDoc(doc(db, "users", user.uid), { email: newEmail }, { merge: true });
    return { ok: true, user: { ...user, email: newEmail } };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function changePassword(user, oldPwd, newPwd) {
  try {
    await updatePassword(auth.currentUser, newPwd);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

/** Helper to patch the user state in Firestore and local state */
export async function patchSession(user, updates) {
  await setDoc(doc(db, "users", user.uid), updates, { merge: true });
  return { ...user, ...updates };
}

export async function saveFcmToken(user, token) {
  if (!user || !token) return;
  // Store the token in a "fcmTokens" array to support multiple devices
  await setDoc(doc(db, "users", user.uid), { 
    fcmTokens: arrayUnion(token) 
  }, { merge: true });
}


// ── Data Persistence ────────────────────────────────────────────────────────

/** 
 * Real-time listener for data. 
 * Since Firestore is real-time, we use onSnapshot instead of a one-time loadData.
 */
export function subscribeToData(namespace, callback) {
  const ns = namespace || "personal";
  const userUid = auth.currentUser?.uid;
  
  if (!userUid) return () => {};

  // We'll store data in a 'data' collection partitioned by namespace
  const dataDocRef = doc(db, "data", ns === "personal" ? userUid : ns);

  return onSnapshot(dataDocRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      // Default data if none exists yet
      callback({
        cats: DEFAULT_CATEGORIES,
        expenses: {},
        monthlyBudgets: {}
      });
    }
  });
}

export async function saveData(namespace, cats, expenses, monthlyBudgets) {
  const ns = namespace || "personal";
  const userUid = auth.currentUser?.uid;
  if (!userUid) return;

  const dataDocRef = doc(db, "data", ns === "personal" ? userUid : ns);
  await setDoc(dataDocRef, {
    cats,
    expenses,
    monthlyBudgets,
    updatedAt: serverTimestamp()
  }, { merge: true });
}
