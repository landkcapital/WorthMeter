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
        <a href="http://localhost:5175" className="nav-btn app-link">
          ZeroLine
        </a>
        <button className="nav-btn sign-out" onClick={handleSignOut}>
          Sign Out
        </button>
      </nav>
    </header>
  );
}
