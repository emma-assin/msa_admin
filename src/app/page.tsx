type Announcement = {

  "use client";

  import { FirebaseError } from "firebase/app";
  import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    type User,
  } from "firebase/auth";
  import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
    type Timestamp,
  } from "firebase/firestore";
  import { FormEvent, useEffect, useMemo, useState } from "react";
  import { auth, db, firebaseConfigError } from "@/lib/firebase";

  type Announcement = {
    id: string;
    title: string;
    body: string;
    createdAt: Timestamp;
    sortOrder: number;
  };

  type AnnouncementFormState = Omit<Announcement, "id" | "createdAt">;

  const defaultAnnouncementForm: AnnouncementFormState = {
    title: "",
    body: "",
    sortOrder: 100,
  };
    }
  };

  const beginEditAnnouncement = (a: Announcement) => {
    setEditingAnnouncementId(a.id);
    setAnnouncementForm({
      title: a.title,
      body: a.body,
      sortOrder: a.sortOrder,
    });
  };

  const removeAnnouncement = async (id: string) => {
    if (!isAdmin || !db) return;
    try {
      await deleteDoc(doc(db, "announcements", id));
    } catch {}
  };
"use client";

import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { auth, db, firebaseConfigError } from "@/lib/firebase";

type ScheduleTemplate = {
  id: string;
  title: string;
  programId: string;
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number;
  coach: string;
  level: string;
  location: string;
  isActive: boolean;
  sortOrder: number;
  updatedAt?: Timestamp;
};

type TemplateFormState = Omit<ScheduleTemplate, "id" | "updatedAt">;

const defaultFormState: TemplateFormState = {
  title: "",
  programId: "adult_kickboxing",
  dayOfWeek: 1,
  startTime: "7:00 PM",
  durationMinutes: 60,
  coach: "Coach Eddie Martin",
  level: "All levels",
  location: "MSA Brooklyn",
  isActive: true,
  sortOrder: 100,
};

const programIdOptions = [
  { value: 'adult_kickboxing', label: 'Adult Kickboxing' },
  { value: 'child_tkd', label: 'Child TKD' },
];

const levelOptions = [
  { value: 'All levels', label: 'All levels' },
  { value: 'Basics', label: 'Basics' },
  { value: 'Intermediate/Advanced', label: 'Intermediate/Advanced' },
];

const dayOptions = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
];

export default function Home() {
  const adminAllowlist = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "";
    return raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  }, []);

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(() => auth == null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateFormState>(defaultFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isAdmin =
    !!user?.email && adminAllowlist.includes(user.email.toLowerCase());

  useEffect(() => {
    if (!auth) {
      return;
    }

    const sub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });

    return () => sub();
  }, []);

  useEffect(() => {
    if (!isAdmin || !db) {
      return;
    }

    const q = query(collection(db, "schedule_templates"), orderBy("sortOrder"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((item) => {
          const data = item.data() as Omit<ScheduleTemplate, "id">;
          return { id: item.id, ...data };
        });
        setTemplates(items);
        setDataError(null);
      },
      (error) => {
        setDataError(error.message);
      },
    );

    return () => unsub();
  }, [isAdmin]);

  const resetForm = () => {
    setForm(defaultFormState);
    setEditingId(null);
  };

  const getAuthErrorMessage = (error: unknown) => {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "(unknown project)";

    if (!(error instanceof FirebaseError)) {
      return error instanceof Error
        ? error.message
        : "Sign-in failed. Check credentials and Firebase settings.";
    }

    switch (error.code) {
      case "auth/operation-not-allowed":
        return `Email/password sign-in is disabled for Firebase project ${projectId}. In Firebase Console, open Authentication > Sign-in method and enable Email/Password.`;
      case "auth/invalid-credential":
      case "auth/wrong-password":
        return "Invalid email or password.";
      case "auth/invalid-email":
        return "Enter a valid email address.";
      case "auth/weak-password":
        return "Password must be at least 6 characters.";
      case "auth/email-already-in-use":
        return "This account already exists. Sign in with the existing password.";
      default:
        return error.message || "Sign-in failed. Check credentials and Firebase settings.";
    }
  };

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    if (!auth) {
      setAuthError("Firebase is not configured for this environment.");
      return;
    }

    event.preventDefault();
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      // Some Firebase projects return auth/invalid-credential for unknown users.
      // We still allow first-login auto-creation to preserve onboarding behavior.
      if (
        error instanceof FirebaseError &&
        (error.code === "auth/user-not-found" ||
          error.code === "auth/invalid-credential")
      ) {
        try {
          await createUserWithEmailAndPassword(auth, email.trim(), password);
          return;
        } catch (createError) {
          setAuthError(getAuthErrorMessage(createError));
          return;
        }
      }

      setAuthError(getAuthErrorMessage(error));
    }
  };

  const handleSaveTemplate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAdmin || !db) {
      return;
    }

    setSaving(true);
    setDataError(null);

    const payload = {
      ...form,
      title: form.title.trim(),
      programId: form.programId.trim(),
      startTime: form.startTime.trim(),
      coach: form.coach.trim(),
      level: form.level.trim(),
      location: form.location.trim(),
      updatedAt: new Date(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "schedule_templates", editingId), payload);
      } else {
        await addDoc(collection(db, "schedule_templates"), payload);
      }
      resetForm();
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const beginEdit = (template: ScheduleTemplate) => {
    setEditingId(template.id);
    setForm({
      title: template.title,
      programId: template.programId,
      dayOfWeek: template.dayOfWeek,
      startTime: template.startTime,
      durationMinutes: template.durationMinutes,
      coach: template.coach,
      level: template.level,
      location: template.location,
      isActive: template.isActive,
      sortOrder: template.sortOrder,
    });
  };

  const removeTemplate = async (id: string) => {
    if (!isAdmin || !db) {
      return;
    }
    try {
      await deleteDoc(doc(db, "schedule_templates", id));
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Delete failed.");
    }
  };

  const toggleTemplate = async (item: ScheduleTemplate) => {
    if (!isAdmin || !db) {
      return;
    }
    try {
      await updateDoc(doc(db, "schedule_templates", item.id), {
        isActive: !item.isActive,
        updatedAt: new Date(),
      });
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Toggle failed.");
    }
  };

  return (
    <main className="page">

      <section className="card hero">
        <h1>MSA Schedule Admin</h1>
        <p>Web editor for recurring classes in Firestore.</p>
      </section>

      {isAdmin && (
        <section className="card">
          <h2>{editingAnnouncementId ? "Edit Announcement" : "Add Announcement"}</h2>
          <form className="form grid" onSubmit={handleSaveAnnouncement}>
            <label>
              Title
              <input
                value={announcementForm.title}
                onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                required
              />
            </label>
            <label>
              Body
              <textarea
                value={announcementForm.body}
                onChange={e => setAnnouncementForm({ ...announcementForm, body: e.target.value })}
                required
                rows={3}
              />
            </label>
            <label>
              Sort order
              <input
                type="number"
                value={announcementForm.sortOrder}
                onChange={e => setAnnouncementForm({ ...announcementForm, sortOrder: Number(e.target.value) })}
                required
              />
            </label>
            <div className="row">
              <button type="submit" disabled={savingAnnouncement}>
                {editingAnnouncementId ? "Save" : "Add"}
              </button>
              {editingAnnouncementId && (
                <button type="button" onClick={resetAnnouncementForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
          <h3>Current Announcements</h3>
          <ul>
            {announcements.map(a => (
              <li key={a.id} style={{ marginBottom: 8 }}>
                <strong>{a.title}</strong> — {a.body}
                <button style={{ marginLeft: 8 }} onClick={() => beginEditAnnouncement(a)}>
                  Edit
                </button>
                <button style={{ marginLeft: 4 }} onClick={() => removeAnnouncement(a.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {firebaseConfigError && (
        <section className="card">
          <h2>Missing Firebase environment variables</h2>
          <p className="error">{firebaseConfigError}</p>
          <p className="subtle">
            Set values from .env.example in .env.local (local) and Railway
            environment variables (production).
          </p>
        </section>
      )}

      {!authReady ? (
        <section className="card">Loading auth...</section>
      ) : !user ? (
        <section className="card">
          <h2>Sign in</h2>
          <form className="form" onSubmit={handleAuthSubmit}>
            <label>
              Email
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
              />
            </label>
            <label>
              Password
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
              />
            </label>
            <button type="submit">Sign in</button>
          </form>
          <p className="subtle">First sign-in can create the account if it does not exist.</p>
          {authError && <p className="error">{authError}</p>}
        </section>
      ) : !isAdmin ? (
        <section className="card">
          <h2>Access denied</h2>
          <p>
            Signed in as <strong>{user.email}</strong>, but this email is not in
            the admin allowlist.
          </p>
          <button onClick={() => auth && signOut(auth)}>Sign out</button>
        </section>
      ) : (
        <>
          <section className="card">
            <div className="row between">
              <h2>{editingId ? "Edit recurring class" : "Add recurring class"}</h2>
              <button onClick={() => auth && signOut(auth)}>Sign out</button>
            </div>

            <form className="form grid" onSubmit={handleSaveTemplate}>
              <label>
                Title
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </label>


              <label>
                Program ID
                <select
                  value={form.programId}
                  onChange={(e) =>
                    setForm({ ...form, programId: e.target.value })
                  }
                  required
                >
                  {programIdOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Weekday
                <select
                  value={form.dayOfWeek}
                  onChange={(e) =>
                    setForm({ ...form, dayOfWeek: Number(e.target.value) })
                  }
                >
                  {dayOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Start time
                <input
                  value={form.startTime}
                  onChange={(e) =>
                    setForm({ ...form, startTime: e.target.value })
                  }
                  placeholder="7:00 PM"
                  required
                />
              </label>

              <label>
                Duration (minutes)
                <input
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm({ ...form, durationMinutes: Number(e.target.value) })
                  }
                  type="number"
                  min={15}
                  required
                />
              </label>

              <label>
                Coach
                <input
                  value={form.coach}
                  onChange={(e) => setForm({ ...form, coach: e.target.value })}
                  required
                />
              </label>


              <label>
                Level
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  required
                >
                  {levelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Location
                <input
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  required
                />
              </label>

              <label>
                Sort order
                <input
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm({ ...form, sortOrder: Number(e.target.value) })
                  }
                  type="number"
                  required
                />
              </label>

              <label className="switchLabel">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                />
                Active
              </label>

              <div className="row">
                <button type="submit" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Update class" : "Add class"}
                </button>
                {editingId && (
                  <button type="button" className="ghost" onClick={resetForm}>
                    Cancel edit
                  </button>
                )}
              </div>
            </form>

            {dataError && <p className="error">{dataError}</p>}
          </section>

          <section className="card">
            <h2>Current recurring schedule</h2>
            <div className="list">
              {templates.map((item) => (
                <article key={item.id} className="listItem">
                  <div>
                    <h3>
                      {item.title} ({item.startTime})
                    </h3>
                    <p>
                      Day {item.dayOfWeek} • {item.level} • {item.coach}
                    </p>
                    <p className="subtle">Program: {item.programId}</p>
                  </div>
                  <div className="row">
                    <button
                      className="ghost"
                      onClick={() => toggleTemplate(item)}
                    >
                      {item.isActive ? "Disable" : "Enable"}
                    </button>
                    <button className="ghost" onClick={() => beginEdit(item)}>
                      Edit
                    </button>
                    <button
                      className="danger"
                      onClick={() => removeTemplate(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
