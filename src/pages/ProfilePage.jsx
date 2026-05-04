import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { 
  Palette, 
  Check, 
  Copy, 
  User, 
  Mail, 
  Lock, 
  LogOut, 
  Home, 
  CircleUser, 
  Plus, 
  Link as LinkIcon,
  X,
  Trash2,
  DoorOpen,
  DollarSign,
  Layers,
  ChevronDown
} from "lucide-react";
import {
  getFamiliesByIds, createFamily, joinFamily,
  leaveFamily, switchActiveFamily, updateNameInFamilies
} from "../storage/families";
import {
  updateUserName, updateUserEmail, changePassword, updateUserAvatar
} from "../storage/storage";
import { fmtCur, monthKey } from "../utils/helpers";
import { CAT_COLORS } from "../constants/categories";

// ── Reusable bits ─────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-3 px-1 flex justify-between items-center">
        {title}
      </h3>
      {children}
    </div>
  );
}

function CopyableCode({ code }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="flex items-center gap-2 bg-base-300 rounded-xl px-3 py-2">
      <span className="font-mono text-lg font-bold tracking-widest text-primary flex-1">
        {code}
      </span>
      <button onClick={copy} className="btn btn-xs btn-ghost btn-square">
        {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
      </button>
    </div>
  );
}

// ── Main ProfilePage ──────────────────────────────────────────────────────────
export function ProfilePage({ user, onUserUpdate, onLogout, expenses, cats }) {
  // ── Forms Visibility ──
  const [activeForm, setActiveForm] = useState(null); // 'avatar' | 'create' | 'join'
  const [activeAccordion, setActiveAccordion] = useState(null); // 'name' | 'email' | 'password'

  // ── Form States ──
  const [nameInput, setNameInput] = useState(user.name || "");
  const [emailInput, setEmailInput] = useState(user.email || "");
  const [pwdInput, setPwdInput] = useState("");
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  // ── Feedback ──
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ── Confirm Modal State ──
  const [confirmLeave, setConfirmLeave] = useState(null); // { id, name, isOwner } | null

  // ── Derived ──
  // ── Async State ──
  const [families, setFamilies] = useState([]);

  // Fetch families when IDs change
  useEffect(() => {
    const fetchFams = async () => {
      const res = await getFamiliesByIds(user.familyIds);
      setFamilies(res);
    };
    fetchFams();
  }, [user.familyIds]);

  const activeFam = families.find(f => f.id === user.activeFamilyId) || null;
  const mk = monthKey();
  const monthExp = expenses[mk] || [];
  const totalSpent = monthExp.reduce((s, e) => s + e.amount, 0);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleUpdateName = async () => {
    if (!nameInput.trim()) return toast.error("Name is required.");
    const updated = await updateUserName(user, nameInput.trim());
    await updateNameInFamilies(updated, nameInput.trim());
    onUserUpdate(updated);
    toast.success("Name updated!");
    setActiveAccordion(null);
  };

  const handleUpdateEmail = async () => {
    const res = await updateUserEmail(user, emailInput.trim(), pwdInput);
    if (res.ok) {
      onUserUpdate(res.user);
      toast.success("Email updated!");
      setPwdInput("");
      setActiveAccordion(null);
    } else {
      toast.error(res.error);
    }
  };

  const handleChangePassword = async () => {
    const res = await changePassword(user, oldPwd, newPwd);
    if (res.ok) {
      toast.success("Password changed!");
      setOldPwd("");
      setNewPwd("");
      setActiveAccordion(null);
    } else {
      toast.error(res.error);
    }
  };

  const handleUpdateAvatar = async (color) => {
    const safeAvatar = typeof user.avatar === 'string' && user.avatar.startsWith('#') ? null : (user.avatar || null);
    const updated = await updateUserAvatar(user, safeAvatar, color);
    onUserUpdate(updated);
    toast.success("Profile color updated!");
    setActiveForm(null);
  };

  const handleCreateFamily = async () => {
    if (!familyName.trim()) return toast.error("Family name is required.");
    const res = await createFamily(familyName, user);
    if (res.ok) {
      onUserUpdate(res.user);
      toast.success(`Family "${familyName}" created!`);
      setFamilyName("");
      setActiveForm(null);
    }
  };

  const handleJoinFamily = async () => {
    if (!inviteCode.trim()) return toast.error("Invite code is required.");
    const res = await joinFamily(inviteCode.trim(), user);
    if (res.ok) {
      onUserUpdate(res.user);
      toast.success("Joined family group!");
      setInviteCode("");
      setActiveForm(null);
    } else {
      toast.error(res.error);
    }
  };

  const handleSwitch = async (id) => {
    const updated = await switchActiveFamily(id, user);
    onUserUpdate(updated);
  };

  const handleLeave = async () => {
    if (!confirmLeave) return;
    const { id } = confirmLeave;
    const res = await leaveFamily(id, user);
    if (res.ok) {
      onUserUpdate(res.user);
      toast.success(confirmLeave.isOwner ? "Family dissolved" : "Left family group");
      setConfirmLeave(null);
    } else {
      toast.error("Action failed");
    }
  };

  return (
    <div className="px-4 pb-28 animate-in fade-in duration-500">

      {/* ── Header / Hero ── */}
      <div
        className="card bg-base-200 shadow-xl overflow-hidden mb-6 border border-base-300"
      >
        <div
          className="h-24 w-full opacity-80"
          style={{ background: `linear-gradient(45deg, ${user.avatarColor || 'var(--color-primary)'}, var(--color-secondary))` }}
        />
        <div className="card-body -mt-12 items-center text-center p-5">
          <div className="avatar placeholder relative">
            <div
              className="w-20 h-20 rounded-full border-4 border-base-200 text-3xl font-extrabold text-white shadow-lg flex justify-center items-center"
              style={{ backgroundColor: user.avatarColor || 'var(--color-primary)' }}
            >
              {(user.name || user.email)[0].toUpperCase()}
            </div>
            <button 
              onClick={() => setActiveForm(activeForm === 'avatar' ? null : 'avatar')}
              className="btn btn-circle btn-xs btn-primary absolute bottom-0 right-0 border-2 border-base-200"
            >
              <Palette size={12} />
            </button>
          </div>
          <div className="mt-2">
            <h2 className="text-xl font-black tracking-tight">{user.name || "User"}</h2>
            <p className="text-xs opacity-50 font-bold uppercase tracking-widest">{user.email}</p>
          </div>

          <div className="mt-3">
            <div className={`badge ${activeFam ? 'badge-primary' : 'badge-ghost'} gap-2 font-bold p-3`}>
              {activeFam ? <Home size={12} /> : <User size={12} />}
              {activeFam ? activeFam.name : "Personal Space"}
            </div>
          </div>
        </div>
      </div>

      {/* ── Status Messages removed as we use Toasts now ── */}

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card bg-base-200 border border-base-300 p-4 flex flex-row items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-xl text-primary"><DollarSign size={24} /></div>
          <div>
            <div className="text-[10px] opacity-50 font-bold uppercase tracking-wider">Monthly Spend</div>
            <div className="text-lg font-black text-primary">{fmtCur(totalSpent)}</div>
          </div>
        </div>
        <div className="card bg-base-200 border border-base-300 p-4 flex flex-row items-center gap-4">
          <div className="p-2 bg-secondary/10 rounded-xl text-secondary"><Layers size={24} /></div>
          <div>
            <div className="text-[10px] opacity-50 font-bold uppercase tracking-wider">Categories</div>
            <div className="text-lg font-black text-secondary">{cats.length}</div>
          </div>
        </div>
      </div>

      {/* ── Multiple Families List ── */}
      <Section title="Your Family Groups">
        <div className="flex flex-col gap-2">
          {/* Personal option */}
          <div
            className={`card flex-row items-center p-3 gap-3 border transition-all cursor-pointer ${user.activeFamilyId === null ? 'bg-primary/10 border-primary shadow-sm' : 'bg-base-200 border-base-300 hover:border-base-content/20'}`}
            onClick={() => handleSwitch(null)}
          >
            <div className="w-10 h-10 rounded-xl bg-base-300 flex items-center justify-center text-primary/60"><User size={20} /></div>
            <div className="flex-1">
              <div className="font-bold text-sm">Personal Space</div>
              <div className="text-[10px] opacity-50 font-bold uppercase">Private data</div>
            </div>
            {user.activeFamilyId === null && <div className="badge badge-primary badge-sm font-bold">Active</div>}
          </div>

          {/* Family list */}
          {families.map(f => (
            <div
              key={f.id}
              className={`card flex-row items-center p-3 gap-3 border transition-all cursor-pointer ${user.activeFamilyId === f.id ? 'bg-primary/10 border-primary shadow-sm' : 'bg-base-200 border-base-300 hover:border-base-content/20'}`}
              onClick={() => handleSwitch(f.id)}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center"><Home size={20} /></div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{f.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="text-[10px] opacity-50 font-bold uppercase">{f.members.length} Members</div>
                  <div className="badge badge-xs badge-outline opacity-30 text-[9px]">{f.inviteCode}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {user.activeFamilyId === f.id && <div className="badge badge-primary badge-sm font-bold">Active</div>}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmLeave({ id: f.id, name: f.name, isOwner: f.ownerEmail === user.email });
                  }}
                  className="btn btn-ghost btn-xs btn-square text-error/40 hover:text-error"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}

          {/* Add/Join buttons */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              onClick={() => setActiveForm(activeForm === 'create' ? null : 'create')}
              className="btn btn-sm btn-outline gap-2"
            >
              <Plus size={14} /> Create
            </button>
            <button
              onClick={() => setActiveForm(activeForm === 'join' ? null : 'join')}
              className="btn btn-sm btn-outline gap-2"
            >
              <LinkIcon size={14} /> Join
            </button>
          </div>
        </div>

        {/* Create Form */}
        {activeForm === 'create' && (
          <div className="card bg-base-300 p-4 mt-3 animate-in slide-in-from-top-2">
            <label className="label text-xs font-bold uppercase opacity-50 py-0">New Family Name</label>
            <div className="flex gap-2">
              <input
                className="input input-sm input-bordered flex-1"
                value={familyName}
                onChange={e => setFamilyName(e.target.value)}
                placeholder="The Smiths"
              />
              <button onClick={handleCreateFamily} className="btn btn-sm btn-primary">Create</button>
            </div>
          </div>
        )}

        {/* Join Form */}
        {activeForm === 'join' && (
          <div className="card bg-base-300 p-4 mt-3 animate-in slide-in-from-top-2">
            <label className="label text-xs font-bold uppercase opacity-50 py-0">Enter Invite Code</label>
            <div className="flex gap-2">
              <input
                className="input input-sm input-bordered flex-1 font-mono uppercase"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
              />
              <button onClick={handleJoinFamily} className="btn btn-sm btn-primary">Join</button>
            </div>
          </div>
        )}
      </Section>

      {/* ── Active Family Details ── */}
      {activeFam && (
        <Section title="Family Settings">
          <div className="card bg-base-200 border border-base-300 p-4 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase opacity-50 mb-1 block tracking-widest">Share this code to invite members</label>
              <CopyableCode code={activeFam.inviteCode} />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase opacity-50 mb-2 block tracking-widest">Family Members</label>
              <div className="flex flex-wrap gap-2">
                {activeFam.members.map(m => (
                  <div key={m.email} className="badge badge-lg gap-2 p-4 h-auto border-base-300 bg-base-300">
                    <div className="w-6 h-6 rounded-full text-[10px] flex items-center justify-center font-bold text-white shadow-sm" style={{ backgroundColor: m.avatarColor }}>
                      {m.name[0]}
                    </div>
                    <div className="flex flex-col leading-none py-1">
                      <span className="text-xs font-bold">{m.name}</span>
                      <span className="text-[9px] opacity-40 truncate max-w-[80px]">{m.email}</span>
                    </div>
                    {m.email === activeFam.ownerEmail && <span className="text-[10px]">👑</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() => setConfirmLeave({ id: activeFam.id, name: activeFam.name, isOwner: activeFam.ownerEmail === user.email })}
            className="btn btn-error btn-outline btn-sm w-full mt-4 gap-2"
          >
            {activeFam.ownerEmail === user.email ? <Trash2 size={14} /> : <LogOut size={14} />}
            {activeFam.ownerEmail === user.email ? "Dissolve Family Group" : "Leave Family Group"}
          </button>

        </Section>
      )
      }

      {/* ── Confirm Leave Modal ── */}
      <div className={`modal modal-bottom sm:modal-middle ${confirmLeave ? 'modal-open' : ''}`}>
        <div className="modal-box border border-base-300 shadow-2xl">
          <h3 className="font-bold text-lg text-error flex items-center gap-2">
            {confirmLeave?.isOwner ? <Trash2 size={20} /> : <DoorOpen size={20} />}
            {confirmLeave?.isOwner ? "Dissolve Family?" : "Leave Family?"}
          </h3>
          <p className="py-4 text-sm opacity-70">
            {confirmLeave?.isOwner
              ? `Are you sure you want to dissolve "${confirmLeave?.name}"? This will delete the group and all its data for everyone.`
              : `Are you sure you want to leave "${confirmLeave?.name}"? You will lose access to this group's shared data.`}
          </p>
          <div className="modal-action">
            <button onClick={() => setConfirmLeave(null)} className="btn btn-ghost btn-sm">Cancel</button>
            <button onClick={handleLeave} className="btn btn-error btn-sm">
              {confirmLeave?.isOwner ? "Confirm Dissolve" : "Confirm Leave"}
            </button>
          </div>
        </div>
        <div className="modal-backdrop backdrop-blur-sm" onClick={() => setConfirmLeave(null)}></div>
      </div>

      {/* ── Account Management ── */}
      <Section title="Account Settings">
        <div className="flex flex-col gap-2">

          {/* Avatar Color Picker */}
          {activeForm === 'avatar' && (
            <div className="card bg-base-200 border border-base-300 p-4 animate-in fade-in">
              <label className="text-xs font-bold uppercase opacity-50 mb-3 block text-center">Pick Your Profile Color</label>
              <div className="flex flex-wrap gap-2 justify-center">
                {CAT_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => handleUpdateAvatar(c)}
                    className={`w-8 h-8 rounded-full border-2 ${user.avatarColor === c ? 'border-base-content scale-110 shadow-md' : 'border-transparent opacity-70'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Change Name */}
          <div className={`collapse collapse-arrow bg-base-200 border border-base-300 shadow-sm ${activeAccordion === 'name' ? 'collapse-open' : 'collapse-close'}`}>
            <div 
              className="collapse-title text-sm font-bold flex items-center gap-3 cursor-pointer"
              onClick={() => setActiveAccordion(activeAccordion === 'name' ? null : 'name')}
            >
              <User size={18} className="text-primary" /> Change Display Name
            </div>
            <div className="collapse-content px-4 pb-4">
              <div className="flex flex-col gap-3 pt-2">
                <input
                  className="input input-sm input-bordered bg-base-100"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                />
                <button onClick={handleUpdateName} className="btn btn-sm btn-primary">Update Name</button>
              </div>
            </div>
          </div>

          {/* Change Email */}
          <div className={`collapse collapse-arrow bg-base-200 border border-base-300 shadow-sm ${activeAccordion === 'email' ? 'collapse-open' : 'collapse-close'}`}>
            <div 
              className="collapse-title text-sm font-bold flex items-center gap-3 cursor-pointer"
              onClick={() => setActiveAccordion(activeAccordion === 'email' ? null : 'email')}
            >
              <Mail size={18} className="text-primary" /> Change Email Address
            </div>
            <div className="collapse-content px-4 pb-4">
              <div className="flex flex-col gap-3 pt-2">
                <div>
                  <label className="label text-[10px] font-bold uppercase opacity-50 py-0">New Email</label>
                  <input
                    className="input input-sm input-bordered bg-base-100 w-full"
                    type="email"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label text-[10px] font-bold uppercase opacity-50 py-0">Confirm Password</label>
                  <input
                    className="input input-sm input-bordered bg-base-100 w-full"
                    type="password"
                    value={pwdInput}
                    onChange={e => setPwdInput(e.target.value)}
                  />
                </div>
                <button onClick={handleUpdateEmail} className="btn btn-sm btn-primary">Verify & Update</button>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className={`collapse collapse-arrow bg-base-200 border border-base-300 shadow-sm ${activeAccordion === 'password' ? 'collapse-open' : 'collapse-close'}`}>
            <div 
              className="collapse-title text-sm font-bold flex items-center gap-3 cursor-pointer"
              onClick={() => setActiveAccordion(activeAccordion === 'password' ? null : 'password')}
            >
              <Lock size={18} className="text-primary" /> Change Password
            </div>
            <div className="collapse-content px-4 pb-4">
              <div className="flex flex-col gap-3 pt-2">
                <div>
                  <label className="label text-[10px] font-bold uppercase opacity-50 py-0">Current Password</label>
                  <input
                    className="input input-sm input-bordered bg-base-100 w-full"
                    type="password"
                    value={oldPwd}
                    onChange={e => setOldPwd(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label text-[10px] font-bold uppercase opacity-50 py-0">New Password</label>
                  <input
                    className="input input-sm input-bordered bg-base-100 w-full"
                    type="password"
                    value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                  />
                </div>
                <button onClick={handleChangePassword} className="btn btn-sm btn-primary">Change Password</button>
              </div>
            </div>
          </div>

        </div>
      </Section>

      {/* ── Logout ── */}
      <div className="mt-8">
        <button onClick={onLogout} className="btn btn-error btn-outline w-full gap-2">
          <LogOut size={18} /> Logout from Account
        </button>
      </div>

    </div >
  );
}
