import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Account({ session }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const email = session?.user?.email || "";

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage("Password updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
    }
    setLoading(false);
  };

  return (
    <div className="page">
      <div className="account-page card">
        <h2>Account</h2>

        <div className="account-section">
          <label className="account-label">Email</label>
          <p className="account-email">{email}</p>
        </div>

        <div className="account-section">
          <h3>Change Password</h3>
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            {error && <p className="form-error">{error}</p>}
            {message && <p className="form-success">{message}</p>}

            <button
              type="submit"
              className="btn primary"
              disabled={loading || !newPassword || !confirmPassword}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
