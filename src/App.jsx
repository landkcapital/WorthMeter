import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getSession, onAuthStateChange } from "./lib/auth";
import Header from "./components/Header";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Account from "./pages/Account";
import "./styles.css";

function ProtectedRoute({ session, ready, children }) {
  if (!ready) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}

function PublicRoute({ session, ready, children }) {
  if (!ready) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }
  if (session) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let ignore = false;

    getSession().then((s) => {
      if (!ignore) {
        setSession(s);
        setReady(true);
      }
    });

    const subscription = onAuthStateChange((s) => {
      if (!ignore) {
        setSession(s);
        setReady(true);
      }
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute session={session} ready={ready}>
              <Login onAuth={setSession} />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute session={session} ready={ready}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute session={session} ready={ready}>
              <Account session={session} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
