import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Layout() {
  const location = useLocation();
  const [browseSearch, setBrowseSearch] = useState(() => sessionStorage.getItem("browseSearch") || "");

  useEffect(() => {
    if (location.pathname === "/") {
      sessionStorage.setItem("browseSearch", location.search);
      setBrowseSearch(location.search);
    }
  }, [location.pathname, location.search]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand">
          Lumen
        </NavLink>
        <nav className="nav">
          <NavLink to={{ pathname: "/", search: browseSearch }} end>
            Discover
          </NavLink>
          <NavLink to="/wishlist">Wishlist</NavLink>
        </nav>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
