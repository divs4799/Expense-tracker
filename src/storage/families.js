import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  arrayUnion,
  arrayRemove,
  deleteDoc
} from "firebase/firestore";
import { db } from "./firebase";
import { patchSession } from "./storage";
import { uid as generateUid } from "../utils/helpers";

/** Read a single family by id from Firestore */
export async function getFamily(familyId) {
  if (!familyId) return null;
  const docSnap = await getDoc(doc(db, "families", familyId));
  return docSnap.exists() ? docSnap.data() : null;
}

/** Get multiple families by ids from Firestore */
export async function getFamiliesByIds(ids) {
  if (!ids || ids.length === 0) return [];
  const families = [];
  for (const id of ids) {
    const f = await getFamily(id);
    if (f) families.push(f);
  }
  return families;
}

function makeCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

/** Create a new family group in Firestore */
export async function createFamily(familyName, user) {
  const inviteCode = makeCode();
  const familyId = generateUid();

  const family = {
    id: familyId,
    name: familyName.trim(),
    inviteCode,
    ownerEmail: user.email,
    members: [{ 
      name: user.name, 
      email: user.email, 
      avatar: user.avatar, 
      avatarColor: user.avatarColor 
    }],
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, "families", familyId), family);

  const familyIds = [...(user.familyIds || []), familyId];
  const updatedUser = await patchSession(user, { familyIds, activeFamilyId: familyId });
  
  return { ok: true, family, user: updatedUser };
}

/** Join an existing family via invite code in Firestore */
export async function joinFamily(inviteCode, user) {
  const familiesRef = collection(db, "families");
  const q = query(familiesRef, where("inviteCode", "==", inviteCode.trim().toUpperCase()));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) return { ok: false, error: "Invalid invite code." };
  
  const familyDoc = querySnapshot.docs[0];
  const family = familyDoc.data();

  if (user.familyIds?.includes(family.id)) return { ok: false, error: "You are already a member." };

  const memberObj = { 
    name: user.name, 
    email: user.email, 
    avatar: user.avatar, 
    avatarColor: user.avatarColor 
  };

  await updateDoc(doc(db, "families", family.id), {
    members: arrayUnion(memberObj)
  });

  const familyIds = [...(user.familyIds || []), family.id];
  const updatedUser = await patchSession(user, { familyIds, activeFamilyId: family.id });
  
  return { ok: true, family, user: updatedUser };
}

/** Switch active family context */
export async function switchActiveFamily(familyId, user) {
  const updatedUser = await patchSession(user, { activeFamilyId: familyId });
  return updatedUser;
}

/** Leave or dissolve family in Firestore */
export async function leaveFamily(familyId, user) {
  const family = await getFamily(familyId);
  if (!family) return { ok: false, error: "Family not found." };

  if (family.ownerEmail === user.email) {
    // Owner dissolves the group
    await deleteDoc(doc(db, "families", familyId));
    // Also delete the associated data document
    await deleteDoc(doc(db, "data", familyId));
  } else {
    // Member leaves
    const memberObj = family.members.find(m => m.email === user.email);
    await updateDoc(doc(db, "families", familyId), {
      members: arrayRemove(memberObj)
    });
  }

  const familyIds = (user.familyIds || []).filter(id => id !== familyId);
  const activeFamilyId = user.activeFamilyId === familyId ? (familyIds[0] || null) : user.activeFamilyId;
  
  const updatedUser = await patchSession(user, { familyIds, activeFamilyId });
  return { ok: true, user: updatedUser };
}

export async function updateNameInFamilies(user, newName) {
  for (const id of (user.familyIds || [])) {
    const family = await getFamily(id);
    if (family) {
      const oldMember = family.members.find(m => m.email === user.email);
      const newMember = { ...oldMember, name: newName };
      await updateDoc(doc(db, "families", id), {
        members: arrayRemove(oldMember)
      });
      await updateDoc(doc(db, "families", id), {
        members: arrayUnion(newMember)
      });
    }
  }
}

/** Get FCM tokens for all members in a family. 
 * If currentFcmToken is provided, it excludes only that specific token 
 * (allowing notifications on other devices of the same user).
 */
export async function getFamilyTokens(familyId, currentUserEmail, currentFcmToken = null) {
  const family = await getFamily(familyId);
  if (!family) return [];
  
  const tokens = [];
  for (const member of family.members) {
    const q = query(collection(db, "users"), where("email", "==", member.email));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0].data();
      
      // Collect from the new array
      if (userDoc.fcmTokens && Array.isArray(userDoc.fcmTokens)) {
        tokens.push(...userDoc.fcmTokens);
      } 
      // Fallback for old single token
      else if (userDoc.fcmToken) {
        tokens.push(userDoc.fcmToken);
      }
    }
  }

  // Deduplicate and filter out the current device's token
  const uniqueTokens = [...new Set(tokens)];
  return currentFcmToken 
    ? uniqueTokens.filter(t => t !== currentFcmToken)
    : uniqueTokens;
}
