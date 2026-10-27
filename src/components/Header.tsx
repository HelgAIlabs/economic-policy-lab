
import { Link, NavLink } from "react-router-dom";

export default function Header() {
  const navigation = [
    { to: "/", label: "Home" },
    { to: "/research", label: "Research" },
    { to: "/articles", label: "Articles" },
    { to: "/team", label: "Team" },
    { to: "/join", label: "Join Us" },
  ];

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="brand">
          Economic Policy Lab
        </Link>

        <Link to="/login" className="login-link">
          Log in
        </Link>
      </div>

      <nav className="main-nav" aria-label="Main navigation">
        {navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
