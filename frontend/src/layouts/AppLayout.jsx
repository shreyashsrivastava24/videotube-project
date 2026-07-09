import React, { useState, useEffect, useRef } from "react";
import { Navigate, Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Home,
  ThumbsUp,
  History,
  Users,
  LayoutDashboard,
  Settings,
  LogOut,
  Search,
  Menu,
  X,
  Play,
  User,
  Plus,
  ChevronRight,
  MessageSquare,
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Home", path: "/", icon: Home },
  { name: "Tweets", path: "/tweets", icon: MessageSquare },
  { name: "Subscriptions", path: "/subscriptions", icon: Users },
  { name: "Liked Videos", path: "/liked", icon: ThumbsUp },
  { name: "History", path: "/history", icon: History },
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Settings", path: "/settings", icon: Settings },
];

const AppLayout = () => {
  const { user, isAuthenticated, loading, logout } = useAuth();

  // Desktop sidebar: collapsed (icon-only) vs full
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Mobile drawer: hidden vs open (completely separate from desktop)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const drawerRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Close on backdrop click (outside the drawer panel)
  const handleBackdropClick = (e) => {
    if (drawerRef.current && !drawerRef.current.contains(e.target)) {
      setMobileMenuOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0B0F19]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileSearchOpen(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0F19] text-white">

      {/* ─── MOBILE DRAWER OVERLAY ───────────────────────────────────────── */}
      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        className={`fixed inset-0 z-40 transition-all duration-300 md:hidden ${
          mobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(0,0,0,0.65)" }}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        ref={drawerRef}
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col md:hidden
          transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{
          background: "linear-gradient(180deg, #111827 0%, #0d1117 100%)",
          borderRight: "1px solid rgba(139,92,246,0.15)",
          boxShadow: mobileMenuOpen ? "4px 0 40px rgba(0,0,0,0.6)" : "none",
        }}
        aria-label="Mobile navigation"
      >
        {/* Drawer Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-gray-800/60 shrink-0">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-bold font-heading tracking-wide"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30">
              <Play fill="currentColor" className="ml-0.5 h-4 w-4" />
            </div>
            <span className="text-base">
              Video<span className="text-purple-400">Tube</span>
            </span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Profile Card */}
        <div className="mx-3 mt-4 mb-2 rounded-2xl bg-gray-800/40 border border-gray-700/30 p-3.5 shrink-0">
          <Link
            to={`/c/${user?.username}`}
            className="flex items-center gap-3"
            onClick={() => setMobileMenuOpen(false)}
          >
            <img
              src={user?.avatar || "https://api.dicebear.com/7.x/adventurer/svg"}
              alt={user?.username}
              className="avatar h-11 w-11 border-2 border-purple-500/40 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user?.fullName}</p>
              <p className="truncate text-xs text-gray-400">@{user?.username}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-600 shrink-0" />
          </Link>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200 min-h-[52px] ${
                  isActive
                    ? "bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-sm"
                    : "text-gray-400 hover:bg-gray-800/60 hover:text-white border border-transparent"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 transition-all ${
                    isActive
                      ? "bg-purple-600 text-white shadow-md shadow-purple-500/30"
                      : "bg-gray-800 text-gray-400 group-hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span>{item.name}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-800/60 shrink-0">
          <button
            onClick={() => { logout(); setMobileMenuOpen(false); }}
            className="flex w-full items-center gap-3.5 rounded-xl px-4 py-3.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-200 min-h-[52px] border border-transparent hover:border-red-500/20"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-800 text-red-400 shrink-0">
              <LogOut className="h-4 w-4" />
            </div>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ─── DESKTOP SIDEBAR ─────────────────────────────────────────────── */}
      <aside
        className={`glass hidden md:flex flex-col inset-y-0 left-0 border-r border-gray-800 transition-all duration-300 shrink-0 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Sidebar Brand */}
        <div className={`flex h-16 items-center px-5 border-b border-gray-800/50 shrink-0 ${
          sidebarOpen ? "justify-start" : "justify-center"
        }`}>
          <Link to="/" className="flex items-center gap-2 font-bold font-heading tracking-wide min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shrink-0">
              <Play fill="currentColor" className="ml-0.5 h-4 w-4" />
            </div>
            {sidebarOpen && (
              <span className="truncate">
                Video<span className="text-purple-500">Tube</span>
              </span>
            )}
          </Link>
        </div>

        {/* Desktop Nav Links */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                title={!sidebarOpen ? item.name : undefined}
                className={`flex items-center gap-4 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                  sidebarOpen ? "" : "justify-center"
                } ${
                  isActive
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                    : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Desktop User Info & Logout */}
        <div className="p-3 border-t border-gray-800/50 shrink-0">
          {sidebarOpen ? (
            <div className="mb-3 flex items-center gap-3 px-1">
              <Link to={`/c/${user?.username}`} className="shrink-0">
                <img
                  src={user?.avatar || "https://api.dicebear.com/7.x/adventurer/svg"}
                  alt={user?.username}
                  className="avatar h-9 w-9 border border-purple-500/30"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link to={`/c/${user?.username}`} className="hover:text-purple-400 transition-colors">
                  <p className="truncate text-sm font-medium text-white">{user?.fullName}</p>
                  <p className="truncate text-xs text-gray-500">@{user?.username}</p>
                </Link>
              </div>
            </div>
          ) : (
            <div className="mb-3 flex justify-center">
              <Link to={`/c/${user?.username}`}>
                <img
                  src={user?.avatar || "https://api.dicebear.com/7.x/adventurer/svg"}
                  alt={user?.username}
                  className="avatar h-8 w-8 border border-purple-500/30"
                />
              </Link>
            </div>
          )}
          <button
            onClick={logout}
            title={!sidebarOpen ? "Logout" : undefined}
            className={`flex w-full items-center gap-4 rounded-xl px-3 py-3 text-sm font-medium text-red-400 transition-all duration-200 hover:bg-red-500/10 ${
              !sidebarOpen ? "justify-center" : ""
            }`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ─── MAIN PANEL ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="glass flex h-16 items-center gap-3 px-4 md:px-6 border-b border-gray-800/50 shrink-0">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-800/60 hover:text-white transition-colors md:hidden shrink-0"
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Desktop sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-800/60 hover:text-white transition-colors shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search bar — desktop */}
          <form onSubmit={handleSearchSubmit} className="hidden sm:block flex-1 max-w-lg">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos..."
                className="w-full rounded-full bg-gray-900 border border-gray-800 py-2 pl-4 pr-10 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500 transition-colors"
              />
              <button
                type="submit"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-white transition-colors"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Mobile search toggle */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="flex sm:hidden h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-800/60 hover:text-white transition-colors ml-auto shrink-0"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Right Actions */}
          <div className="hidden sm:flex items-center gap-3 ml-auto shrink-0">
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-500/15 hover:opacity-90 transition-opacity"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create</span>
            </Link>
            <Link
              to={`/c/${user?.username}`}
              className="avatar h-9 w-9 bg-gray-800 border border-purple-500/20"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.fullName}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
              )}
            </Link>
          </div>

          {/* Mobile: Create shortcut only (hidden when search open) */}
          <Link
            to="/dashboard"
            className="flex sm:hidden h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shrink-0"
            aria-label="Create"
          >
            <Plus className="h-4 w-4" />
          </Link>
        </header>

        {/* Mobile search bar (expandable, below header) */}
        <div
          className={`sm:hidden overflow-hidden transition-all duration-300 border-b border-gray-800/50 bg-[#0B0F19] ${
            mobileSearchOpen ? "max-h-16 py-2 px-4" : "max-h-0"
          }`}
        >
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos..."
              className="w-full rounded-full bg-gray-900 border border-gray-800 py-2.5 pl-4 pr-10 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500 transition-colors"
              autoFocus={mobileSearchOpen}
            />
            <button
              type="submit"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-white"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 md:px-6 md:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
