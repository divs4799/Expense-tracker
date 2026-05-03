import { useState, useCallback, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./storage/firebase";
import { 
  KEYS, 
  saveData, 
  clearSession, 
  subscribeToData 
} from "./storage/storage";
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

  // 1. Listen for Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // We have a user, we'll let the Login/Register handlers 
        // provide the initial profile data, or we could fetch it here.
        // For simplicity, we'll keep the profile in the user state.
        setUser(prev => prev || firebaseUser);
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

  // ── Data mutators (Now Async) ──────────────────────────────────────────────
  const setCats = useCallback(async (newCats) => {
    await saveData(ns, newCats, data.expenses, data.monthlyBudgets);
    toast.success("Categories updated!");
  }, [ns, data.expenses, data.monthlyBudgets]);

  const addExpense = useCallback(async (exp) => {
    const mk          = monthKey(new Date(exp.date));
    const newExpenses = { ...data.expenses, [mk]: [...(data.expenses[mk] || []), exp] };
    await saveData(ns, data.cats, newExpenses, data.monthlyBudgets);
    toast.success("Expense added!");
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
        onLogout={handleLogout}
      />

      <div className="pt-3">
        {tab === "home"       && <Dashboard      cats={data.cats} expenses={data.expenses} monthlyBudgets={data.monthlyBudgets} onNav={setTab} onSetBudget={() => setSetBudgetOpen(true)} />}
        {tab === "expenses"   && <ExpensesView   cats={data.cats} expenses={data.expenses} onAdd={() => setAddExpOpen(true)} />}
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
