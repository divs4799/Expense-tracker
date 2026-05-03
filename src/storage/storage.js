import { DEFAULT_CATEGORIES, CAT_COLORS } from "../constants/categories";

export const KEYS = {
  theme:   "fam_theme",
  session: "fam_session",
  users:   "fam_users",
};

const DEMO_PASSWORD = "12345";

// ── Namespaced data keys (one set per family OR "personal") ───────────────────
export function getDataKeys(namespace) {
  const ns = namespace || "personal";
  return {
    cats:           `fam_cats_${ns}`,
    expenses:       `fam_expenses_${ns}`,
    monthlyBudgets: `fam_budgets_${ns}`,
  };
}

export function loadData(namespace) {
  const keys = getDataKeys(namespace);
  try {
    return {
      cats:           JSON.parse(localStorage.getItem(keys.cats))           || DEFAULT_CATEGORIES,
      expenses:       JSON.parse(localStorage.getItem(keys.expenses))       || {},
      monthlyBudgets: JSON.parse(localStorage.getItem(keys.monthlyBudgets)) || {},
    };
  } catch {
    return { cats: DEFAULT_CATEGORIES, expenses: {}, monthlyBudgets: {} };
  }
}

export function saveData(namespace, cats, expenses, monthlyBudgets) {
  const keys = getDataKeys(namespace);
  localStorage.setItem(keys.cats,           JSON.stringify(cats));
  localStorage.setItem(keys.expenses,       JSON.stringify(expenses));
  localStorage.setItem(keys.monthlyBudgets, JSON.stringify(monthlyBudgets));
}

// ── Session ───────────────────────────────────────────────────────────────────
export function getSession() {
  try { return JSON.parse(localStorage.getItem(KEYS.session)) || null; }
  catch { return null; }
}
export function setSession(user) {
  localStorage.setItem(KEYS.session, JSON.stringify(user));
}
export function clearSession() {
  localStorage.removeItem(KEYS.session);
}

// ── Internal user helpers ─────────────────────────────────────────────────────
export function getUsers() {
  try { return JSON.parse(localStorage.getItem(KEYS.users)) || []; }
  catch { return []; }
}
function saveUsers(users) {
  localStorage.setItem(KEYS.users, JSON.stringify(users));
}
function patchUser(email, updates) {
  saveUsers(getUsers().map((u) => u.email === email ? { ...u, ...updates } : u));
}

// Strip sensitive fields for session
function toSession(u) {
  return {
    name:           u.name,
    email:          u.email,
    avatar:         u.avatar         ?? null,
    avatarColor:    u.avatarColor    ?? CAT_COLORS[0],
    familyIds:      u.familyIds      ?? [],
    activeFamilyId: u.activeFamilyId ?? null,
  };
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export function registerUser(name, email, password) {
  const users = getUsers();
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, error: "An account with this email already exists." };
  }
  const avatarColor = CAT_COLORS[Math.floor(Math.random() * CAT_COLORS.length)];
  const rec = { name, email: email.toLowerCase(), password, avatar: null, avatarColor, familyIds: [], activeFamilyId: null };
  saveUsers([...users, rec]);
  const user = toSession(rec);
  setSession(user);
  return { ok: true, user };
}

export function loginUser(email, password) {
  const users = getUsers();
  const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  const expected = found?.password ?? DEMO_PASSWORD;
  if (password !== expected) return { ok: false, error: "Incorrect password." };
  const user = found ? toSession(found) : { name: email.split("@")[0], email: email.toLowerCase(), avatar: null, avatarColor: CAT_COLORS[0], familyIds: [], activeFamilyId: null };
  setSession(user);
  return { ok: true, user };
}

export function updateUserName(user, newName) {
  patchUser(user.email, { name: newName });
  const updated = { ...user, name: newName };
  setSession(updated);
  return updated;
}

export function updateUserAvatar(user, avatar, avatarColor) {
  patchUser(user.email, { avatar, avatarColor });
  const updated = { ...user, avatar, avatarColor };
  setSession(updated);
  return updated;
}

export function updateUserEmail(user, newEmail, password) {
  const users   = getUsers();
  const current = users.find((u) => u.email === user.email);
  if ((current?.password ?? DEMO_PASSWORD) !== password) return { ok: false, error: "Incorrect password." };
  if (users.find((u) => u.email === newEmail.toLowerCase() && u.email !== user.email)) return { ok: false, error: "Email already in use." };
  patchUser(user.email, { email: newEmail.toLowerCase() });
  const updated = { ...user, email: newEmail.toLowerCase() };
  setSession(updated);
  return { ok: true, user: updated };
}

export function changePassword(user, oldPwd, newPwd) {
  const users   = getUsers();
  const current = users.find((u) => u.email === user.email);
  if ((current?.password ?? DEMO_PASSWORD) !== oldPwd) return { ok: false, error: "Current password is incorrect." };
  if (newPwd.length < 3) return { ok: false, error: "New password must be at least 3 characters." };
  patchUser(user.email, { password: newPwd });
  return { ok: true };
}

/** Called by families.js when familyIds/activeFamilyId change */
export function patchSession(user, updates) {
  const updated = { ...user, ...updates };
  setSession(updated);
  patchUser(user.email, updates);
  return updated;
}
