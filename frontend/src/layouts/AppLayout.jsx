import React, { useState } from "react";
import { Navigate, Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
  Plus
} from "lucide-react";

const AppLayout = () => {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

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
    }
  };

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Subscriptions", path: "/subscriptions", icon: Users },
    { name: "Liked Videos", path: "/liked", icon: ThumbsUp },
    { name: "History", path: "/history", icon: History },
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0F19] text-white">
      {/* Sidebar */}
      <aside
        className={`glass fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-gray-800 transition-transform duration-300 md:static ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:w-20"
        }`}
      >
        {/* Sidebar Brand Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-800/50">
          <Link to="/" className="flex items-center gap-2 font-bold font-heading tracking-wide">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md">
              <Play fill="currentColor" className="ml-0.5 h-4 w-4" />
            </div>
            {sidebarOpen && (
              <span>
                Video<span className="text-purple-500">Tube</span>
              </span>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
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

        {/* User Info / Logout at Bottom */}
        <div className="p-4 border-t border-gray-800/50">
          {sidebarOpen ? (
            <div className="mb-4 flex items-center gap-3">
              <Link to={`/c/${user?.username}`}>
                <img
                  src={user?.avatar || "https://api.dicebear.com/7.x/adventurer/svg"}
                  alt={user?.username}
                  className="h-10 w-10 rounded-full border border-purple-500/30 object-cover"
                />
              </Link>
              <div className="overflow-hidden">
                <Link to={`/c/${user?.username}`} className="hover:text-purple-400">
                  <p className="truncate text-sm font-medium">{user?.fullName}</p>
                  <p className="truncate text-xs text-gray-500">@{user?.username}</p>
                </Link>
              </div>
            </div>
          ) : (
            <div className="mb-4 flex justify-center">
              <Link to={`/c/${user?.username}`}>
                <img
                  src={user?.avatar || "https://api.dicebear.com/7.x/adventurer/svg"}
                  alt={user?.username}
                  className="h-8 w-8 rounded-full border border-purple-500/30 object-cover"
                />
              </Link>
            </div>
          )}

          <button
            onClick={logout}
            className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition-all duration-200 hover:bg-red-500/10"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="glass flex h-16 items-center justify-between px-6 border-b border-gray-800/50">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-800/50"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="hidden w-full max-w-lg px-4 sm:block">
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
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-white"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* User Profile & Quick Publish Shortcut */}
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-500/15 hover:opacity-90 transition-opacity"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create</span>
            </Link>

            <Link
              to={`/c/${user?.username}`}
              className="flex items-center justify-center h-9 w-9 rounded-full bg-gray-800 border border-purple-500/20"
            >
              {user?.avatar ? (
                <img
                  src={user?.avatar}
                  alt={user.fullName}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-gray-400" />
              )}
            </Link>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
