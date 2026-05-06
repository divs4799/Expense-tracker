import { useState, useCallback, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./storage/firebase";
import { 
  KEYS, 
  saveData, 
  clearSession, 
  subscribeToData,
  getUserProfile,
  saveFcmToken
} from "./storage/storage";
import { getFamilyTokens } from "./storage/families";
import { useFCM } from "./hooks/useFCM";
import { monthKey } from "./utils/helpers";
import { DEFAULT_CATEGORIES } from "./constants/categories";

import { ProtectedRoute }  from "./components/auth/ProtectedRoute";
import { Header }          from "./components/layout/Header";
import { BottomNav }       from "./components/layout/BottomNav";
import { AddExpenseModal } from "./components/modals/AddExpenseModal";
import { SetBudgetModal }  from "./components/modals/SetBudgetModal";

import { LoginPage }      from "./pages/LoginPage";
import { RegisterPage }   from "./pages/RegisterPage";
import { Dashboard }      from "./pages/Dashboard";
import { ExpensesView }   from "./pages/ExpensesView";
import { ChartsView }     from "./pages/ChartsView";
import { CategoriesView } from "./pages/CategoriesView";
import { ProfilePage }    from "./pages/ProfilePage";

import { 
  Home, 
  ReceiptText, 
  PieChart, 
  Layers, 
  UserCircle 
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

const TABS = [
  { id: "home",       icon: <Home size={20} />,        label: "Home"       },
  { id: "expenses",   icon: <ReceiptText size={20} />, label: "Expenses"   },
  { id: "charts",     icon: <PieChart size={20} />,    label: "Charts"     },
  { id: "categories", icon: <Layers size={20} />,      label: "Categories" },
  { id: "profile",    icon: <UserCircle size={20} />,  label: "Profile"    },
];

const FONT = { fontFamily: "'DM Sans', system-ui, sans-serif" };

export default function App() {
  const [dark, setDark]   = useState(() => localStorage.getItem(KEYS.theme) !== "light");
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState("login");

  const [data, setData] = useState({
    cats: DEFAULT_CATEGORIES,
    expenses: {},
    monthlyBudgets: {}
  });
  
  const [tab,  setTab]                    = useState("home");
  const [addExpOpen,    setAddExpOpen]    = useState(false);
  const [setBudgetOpen, setSetBudgetOpen] = useState(false);

  // Namespace for data syncing
  const ns = user?.activeFamilyId || "personal";

  const { fcmToken } = useFCM();

  useEffect(() => {
    if (user && fcmToken) {
      saveFcmToken(user, fcmToken);
    }
  }, [user, fcmToken]);

  const notifyFamily = async (title, body) => {
    if (!user?.activeFamilyId) return;
    const tokens = await getFamilyTokens(user.activeFamilyId, user.email, fcmToken);
    if (tokens.length === 0) return;
    try {
      await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens, title, body })
      });
    } catch (e) {
      console.error("Failed to notify family", e);
    }
  };

  // 1. Listen for Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch the full profile so we don't lose custom fields like avatarColor on refresh
        const profile = await getUserProfile(firebaseUser.uid);
        setUser(prev => ({ ...firebaseUser, ...(profile || {}) }));
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Listen for Data changes (Real-time Sync)
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToData(ns, (newData) => {
      setData(newData);
    });
    return () => unsubscribe();
  }, [user, ns]);

  // ── Theme ──────────────────────────────────────────────────────────────────
  const toggleTheme = () => setDark((d) => {
    const next = !d;
    localStorage.setItem(KEYS.theme, next ? "dark" : "light");
    return next;
  });

  // ── Auth ───────────────────────────────────────────────────────────────────
  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    setTab("home");
  };

  const handleLogout = async () => {
    await clearSession();
    setUser(null);
    setTab("home");
    setAddExpOpen(false);
    setSetBudgetOpen(false);
    setScreen("login");
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  const handleTestNotification = async () => {
    if (!user?.activeFamilyId) {
      toast.error("You are not in a family group.");
      return;
    }
    const tId = toast.loading("Sending test notification...");
    try {
      const tokens = await getFamilyTokens(user.activeFamilyId, user.email, fcmToken);
      if (tokens.length === 0) {
        toast.error("No other devices found. Ensure family members have logged in and enabled notifications.", { id: tId });
        return;
      }
      
      const res = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tokens, 
          title: "🔔 Test Notification", 
          body: `Notification system check by ${user.name || user.email}` 
        })
      });
      
      const result = await res.json();
      if (result.success) {
        toast.success(`Sent to ${result.successCount} of ${tokens.length} devices!`, { id: tId });
      } else {
        toast.error(`Failed: ${result.error || "Unknown error"}`, { id: tId });
      }
    } catch (e) {
      toast.error(`Error: ${e.message}`, { id: tId });
    }
  };

  // ── Data mutators (Now Async) ──────────────────────────────────────────────
  const setCats = useCallback(async (newCats) => {
    await saveData(ns, newCats, data.expenses, data.monthlyBudgets);
    toast.success("Categories updated!");
  }, [ns, data.expenses, data.monthlyBudgets]);

  const addExpense = useCallback(async (exp) => {
    const mk          = monthKey(new Date(exp.date));
    const expWithUser = { ...exp, createdBy: user?.name || user?.email || "Unknown" };
    const newExpenses = { ...data.expenses, [mk]: [...(data.expenses[mk] || []), expWithUser] };
    await saveData(ns, data.cats, newExpenses, data.monthlyBudgets);
    toast.success("Expense added!");

    // Notifications
    const userName = user?.name || user?.email || "Someone";
    notifyFamily("New Expense", `${userName} added a new expense for ₹${exp.amount}.`);

    // Budget overrun checks
    const mb = data.monthlyBudgets[mk] || 0;
    if (mb > 0) {
      const currentTotal = (data.expenses[mk] || []).reduce((sum, e) => sum + e.amount, 0);
      const newTotal = currentTotal + exp.amount;
      if (newTotal > mb && currentTotal <= mb) {
        notifyFamily("Budget Exceeded!", `The monthly budget of ₹${mb} has been exceeded.`);
      }
    }

    const cat = data.cats.find(c => c.id === exp.categoryId);
    if (cat && cat.budget > 0) {
      const currentCatTotal = (data.expenses[mk] || [])
        .filter(e => e.categoryId === exp.categoryId)
        .reduce((sum, e) => sum + e.amount, 0);
      const newCatTotal = currentCatTotal + exp.amount;
      if (newCatTotal > cat.budget && currentCatTotal <= cat.budget) {
        notifyFamily("Category Budget Exceeded!", `The ${cat.name} budget has been exceeded.`);
      }
    }

  }, [user, ns, data.cats, data.expenses, data.monthlyBudgets]);

  const editExpense = useCallback(async (oldExp, newExp) => {
    const oldMk = monthKey(new Date(oldExp.date));
    const newMk = monthKey(new Date(newExp.date));
    let newExpenses = { ...data.expenses };

    // Remove from old month array
    newExpenses[oldMk] = (newExpenses[oldMk] || []).filter(e => e.id !== oldExp.id);
    // Add to new month array
    newExpenses[newMk] = [...(newExpenses[newMk] || []), newExp];

    await saveData(ns, data.cats, newExpenses, data.monthlyBudgets);
    toast.success("Expense updated!");
  }, [ns, data.cats, data.expenses, data.monthlyBudgets]);

  const deleteExpense = useCallback(async (exp) => {
    const mk = monthKey(new Date(exp.date));
    const newExpenses = { ...data.expenses };
    newExpenses[mk] = (newExpenses[mk] || []).filter(e => e.id !== exp.id);
    await saveData(ns, data.cats, newExpenses, data.monthlyBudgets);
    toast.success("Expense deleted!");
  }, [ns, data.cats, data.expenses, data.monthlyBudgets]);

  const saveMonthlyBudget = useCallback(async (amount) => {
    const mk    = monthKey();
    const newMB = { ...data.monthlyBudgets, [mk]: amount };
    await saveData(ns, data.cats, data.expenses, newMB);
    toast.success("Monthly budget updated!");
  }, [ns, data.cats, data.expenses, data.monthlyBudgets]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <span className="loading loading-ring loading-lg text-primary"></span>
      </div>
    );
  }

  // ── Auth screens ──────────────────────────────────────────────────────────
  const authScreens = (
    <div data-theme={dark ? "dark" : "light"} style={FONT}>
      {screen === "login"
        ? <LoginPage    onLogin={handleLogin}    onGoRegister={() => setScreen("register")} />
        : <RegisterPage onRegister={handleLogin} onGoLogin={()    => setScreen("login")}    />
      }
    </div>
  );

  // ── Protected app shell ────────────────────────────────────────────────────
  const appShell = (
    <div
      data-theme={dark ? "dark" : "light"}
      style={FONT}
      className="min-h-screen bg-base-100 text-base-content transition-colors duration-300"
    >
      <Header
        tab={tab} tabs={TABS} dark={dark}
        user={user}
        onToggleTheme={toggleTheme}
        onAddExpense={() => setAddExpOpen(true)}
        onTestNotification={handleTestNotification}
        onLogout={handleLogout}
      />

      <div className="pt-3">
        {tab === "home"       && <Dashboard      cats={data.cats} expenses={data.expenses} monthlyBudgets={data.monthlyBudgets} onNav={setTab} onSetBudget={() => setSetBudgetOpen(true)} />}
        {tab === "expenses"   && <ExpensesView   cats={data.cats} expenses={data.expenses} onAdd={() => setAddExpOpen(true)} onEdit={editExpense} onDelete={deleteExpense} />}
        {tab === "charts"     && <ChartsView     cats={data.cats} expenses={data.expenses} />}
        {tab === "categories" && <CategoriesView cats={data.cats} expenses={data.expenses} onCatsChange={setCats} />}
        {tab === "profile"    && (
          <ProfilePage
            user={user}
            expenses={data.expenses}
            cats={data.cats}
            onUserUpdate={handleUserUpdate}
            onLogout={handleLogout}
          />
        )}
      </div>

      <BottomNav tab={tab} tabs={TABS} onTabChange={setTab} />

      <AddExpenseModal open={addExpOpen}    onClose={() => setAddExpOpen(false)}    cats={data.cats} onAdd={addExpense}          />
      <SetBudgetModal  open={setBudgetOpen} onClose={() => setSetBudgetOpen(false)} monthlyBudgets={data.monthlyBudgets} onSave={saveMonthlyBudget} />
    </div>
  );

  return (
    <ProtectedRoute fallback={authScreens}>
      {appShell}
      <Toaster 
        position="top-center" 
        toastOptions={{
          className: 'font-bold text-sm',
          style: {
            background: '#1a1d27',
            color: '#e2e8f0',
            border: '1px solid #2e3250',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          },
        }}
      />
    </ProtectedRoute>
  );
}
