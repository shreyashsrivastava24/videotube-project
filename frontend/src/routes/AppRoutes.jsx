import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import AuthLayout from "../layouts/AuthLayout";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Watch from "../pages/Watch";
import Profile from "../pages/Profile";
import Dashboard from "../pages/Dashboard";
import LikedVideos from "../pages/LikedVideos";
import History from "../pages/History";
import Subscriptions from "../pages/Subscriptions";
import PlaylistDetail from "../pages/PlaylistDetail";
import Search from "../pages/Search";
import Settings from "../pages/Settings";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* Protected app routes */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/watch/:videoId" element={<Watch />} />
          <Route path="/c/:username" element={<Profile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/liked" element={<LikedVideos />} />
          <Route path="/history" element={<History />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/playlist/:playlistId" element={<PlaylistDetail />} />
          <Route path="/search" element={<Search />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
