import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Play } from "lucide-react";

const AuthLayout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0B0F19]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-[#0B0F19] p-4 text-white overflow-x-hidden">
      {/* Dynamic background glow — constrained so they don't cause overflow */}
      <div className="fixed top-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-purple-600/10 blur-[100px] pointer-events-none" aria-hidden="true"></div>
      <div className="fixed bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" aria-hidden="true"></div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex items-center gap-2 text-2xl font-bold font-heading tracking-wide">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20">
              <Play fill="currentColor" className="ml-0.5 h-5 w-5" />
            </div>
            <span>
              Video<span className="text-purple-500">Tube</span>
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-400">Stream and share premium video content</p>
        </div>

        <div className="glass rounded-2xl p-5 sm:p-8 shadow-2xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
