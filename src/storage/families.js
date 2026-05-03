import { uid } from "../utils/helpers";
import { getSession, patchSession } from "./storage";

const FAMILIES_KEY = "fam_families";

// ── Internal helpers ──────────────────────────────────────────────────────────
function getFamilies() {
  try { return JSON.parse(localStorage.getItem(FAMILIES_KEY)) || {}; }
  catch { return {}; }
}

function saveFamilies(f) {
  localStorage.setItem(FAMILIES_KEY, JSON.stringify(f));
}

function makeCode(existing) {
  let code;
  do { code = Math.random().toString(36).slice(2, 8).toUpperCase(); }
  while (existing.includes(code));
  return code;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getFamily(familyId) {
  return getFamilies()[familyId] || null;
}

/** Get multiple families by ids */
export function getFamiliesByIds(ids) {
  const all = getFamilies();
  return (ids || []).map(id => all[id]).filter(Boolean);
}

/**
 * Create a new family group.
 */
export function createFamily(familyName, user) {
  const families   = getFamilies();
  const usedCodes  = Object.values(families).map((f) => f.inviteCode);
  const id         = uid();
  const inviteCode = makeCode(usedCodes);

  const family = {
    id,
    name:        familyName.trim(),
    inviteCode,
    ownerEmail:  user.email,
    members:     [{ name: user.name, email: user.email, avatar: user.avatar, avatarColor: user.avatarColor }],
    createdAt:   new Date().toISOString(),
  };

  families[id] = family;
  saveFamilies(families);

  const familyIds = [...(user.familyIds || []), id];
  const updatedUser = patchSession(user, { familyIds, activeFamilyId: id });
  
  return { ok: true, family, user: updatedUser };
}

/**
 * Join an existing family via invite code.
 */
export function joinFamily(inviteCode, user) {
  const families = getFamilies();
  const family   = Object.values(families).find(
    (f) => f.inviteCode.toUpperCase() === inviteCode.trim().toUpperCase()
  );

  if (!family) return { ok: false, error: "Invalid invite code." };
  if (user.familyIds?.includes(family.id)) return { ok: false, error: "You are already a member of this family." };

  family.members.push({ name: user.name, email: user.email, avatar: user.avatar, avatarColor: user.avatarColor });
  families[family.id] = family;
  saveFamilies(families);

  const familyIds = [...(user.familyIds || []), family.id];
  const updatedUser = patchSession(user, { familyIds, activeFamilyId: family.id });
  
  return { ok: true, family, user: updatedUser };
}

/**
 * Switch the active family context.
 */
export function switchActiveFamily(familyId, user) {
  // familyId can be null for "personal"
  const updatedUser = patchSession(user, { activeFamilyId: familyId });
  return updatedUser;
}

/**
 * Leave a family.
 */
export function leaveFamily(familyId, user) {
  const families = getFamilies();
  const family   = families[familyId];

  if (family) {
    if (family.ownerEmail === user.email) {
      // Owner dissolves? Or just leaves? Let's say owner dissolves for now to match previous logic
      delete families[familyId];
    } else {
      family.members = family.members.filter((m) => m.email !== user.email);
      families[familyId] = family;
    }
    saveFamilies(families);
  }

  const familyIds = (user.familyIds || []).filter(id => id !== familyId);
  const activeFamilyId = user.activeFamilyId === familyId ? (familyIds[0] || null) : user.activeFamilyId;
  
  const updatedUser = patchSession(user, { familyIds, activeFamilyId });
  return { ok: true, user: updatedUser };
}

/** Update user name across all families they belong to */
export function updateNameInFamilies(user, newName) {
  const families = getFamilies();
  (user.familyIds || []).forEach(id => {
    const f = families[id];
    if (f) {
      const m = f.members.find(member => member.email === user.email);
      if (m) m.name = newName;
    }
  });
  saveFamilies(families);
}
