import { useState, useCallback, useEffect } from "react";
import { KEYS, loadData, saveData, getSession, clearSession } from "./storage/storage";
import { monthKey } from "./utils/helpers";

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

const TABS = [
  { id: "home",       icon: "🏠", label: "Home"       },
  { id: "expenses",   icon: "📝", label: "Expenses"   },
  { id: "charts",     icon: "📊", label: "Charts"     },
  { id: "categories", icon: "🗂",  label: "Categories" },
  { id: "profile",    icon: "👤", label: "Profile"    },
];

const FONT = { fontFamily: "'DM Sans', system-ui, sans-serif" };

export default function App() {
  const [dark, setDark]   = useState(() => localStorage.getItem(KEYS.theme) !== "light");
  const [user, setUser]   = useState(() => getSession());
  const [screen, setScreen] = useState("login");

  // Namespace is either the active family ID or 'personal'
  const ns = user?.activeFamilyId || "personal";
  
  const [data, setData]                   = useState(() => loadData(ns));
  const [tab,  setTab]                    = useState("home");
  const [addExpOpen,    setAddExpOpen]    = useState(false);
  const [setBudgetOpen, setSetBudgetOpen] = useState(false);

  // Sync data when namespace (active family) changes
  useEffect(() => {
    if (user) {
      setData(loadData(user.activeFamilyId || "personal"));
    }
  }, [user?.activeFamilyId]);

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

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setTab("home");
    setAddExpOpen(false);
    setSetBudgetOpen(false);
    setScreen("login");
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  // ── Data mutators ──────────────────────────────────────────────────────────
  const setCats = useCallback((newCats) => {
    setData((d) => { 
      saveData(ns, newCats, d.expenses, d.monthlyBudgets); 
      return { ...d, cats: newCats }; 
    });
  }, [ns]);

  const addExpense = useCallback((exp) => {
    setData((d) => {
      const mk          = monthKey(new Date(exp.date));
      const newExpenses = { ...d.expenses, [mk]: [...(d.expenses[mk] || []), exp] };
      saveData(ns, d.cats, newExpenses, d.monthlyBudgets);
      return { ...d, expenses: newExpenses };
    });
  }, [ns]);

  const saveMonthlyBudget = useCallback((amount) => {
    setData((d) => {
      const mk    = monthKey();
      const newMB = { ...d.monthlyBudgets, [mk]: amount };
      saveData(ns, d.cats, d.expenses, newMB);
      return { ...d, monthlyBudgets: newMB };
    });
  }, [ns]);

  // ── Auth screens (public) ──────────────────────────────────────────────────
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
    </ProtectedRoute>
  );
}
