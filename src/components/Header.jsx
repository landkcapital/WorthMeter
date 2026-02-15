import { useNavigate } from "react-router-dom";
import { signOut } from "../lib/auth";

export default function Header() {
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <header className="header">
      <h1 className="logo" onClick={() => navigate("/")}>
        WorthMeter
      </h1>
      <nav className="header-nav">
        <button className="nav-btn app-link" onClick={() => navigate("/account")}>
          Account
        </button>
        <button className="nav-btn sign-out" onClick={handleSignOut}>
          Sign Out
        </button>
      </nav>
    </header>
  );
}
