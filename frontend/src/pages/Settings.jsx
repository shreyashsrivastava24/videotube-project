import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import { User, Lock, Upload, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const Settings = () => {
  const { user, updateAccount, updateAvatar, updateCoverImage } = useAuth();

  // Details state
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");

  // Password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  // Loading states
  const [updatingDetails, setUpdatingDetails] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [updatingCover, setUpdatingCover] = useState(false);

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;
    setUpdatingDetails(true);
    try {
      await updateAccount(fullName, email);
    } catch {
      // Error handled by AuthContext
    } finally {
      setUpdatingDetails(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;
    setUpdatingPassword(true);
    try {
      const response = await api.post("/users/change-password", { oldPassword, newPassword });
      toast.success(response.data?.message || "Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUpdatingAvatar(true);
    try {
      await updateAvatar(file);
    } catch {
      // Error handled by AuthContext
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUpdatingCover(true);
    try {
      await updateCoverImage(file);
    } catch {
      // Error handled by AuthContext
    } finally {
      setUpdatingCover(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-white">Account Settings</h1>
        <p className="text-xs text-gray-400">Update your profile settings and security details</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Profile Avatars / Media updates column */}
        <div className="md:col-span-1 space-y-4">
          {/* Avatar Upload */}
          <div className="glass rounded-2xl p-5 flex flex-col items-center text-center">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Avatar Image</h3>
            <div className="relative group shrink-0 avatar h-24 w-24 border border-purple-500/20">
              <img
                src={user?.avatar || "https://api.dicebear.com/7.x/adventurer/svg"}
                alt="Avatar"
              />
              <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                {updatingAvatar ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Upload className="h-5 w-5 text-white" />}
              </label>
            </div>
            <p className="mt-3 text-[10px] text-gray-500">Click image to upload new avatar</p>
          </div>

          {/* Cover Image Upload */}
          <div className="glass rounded-2xl p-5 flex flex-col items-center text-center">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Cover Image</h3>
            <div className="relative group w-full aspect-[3/1] bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
              <img
                src={user?.coverImage || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400"}
                alt="Cover"
                className="cover-img absolute inset-0"
              />
              <label className="absolute inset-0 flex items-center justify-center bg-black/60 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                {updatingCover ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Upload className="h-5 w-5 text-white" />}
              </label>
            </div>
            <p className="mt-3 text-[10px] text-gray-500">Click banner to upload new cover image</p>
          </div>
        </div>

        {/* Inputs forms column */}
        <div className="md:col-span-2 space-y-6">
          {/* Account Details Form */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 border-b border-gray-800 pb-3 mb-4">
              <User className="h-4 w-4 text-purple-400" />
              <h2 className="text-sm font-bold font-heading text-white">Profile Information</h2>
            </div>

            <form onSubmit={handleUpdateDetails} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl bg-gray-950 border border-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl bg-gray-950 border border-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={updatingDetails}
                className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {updatingDetails ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 border-b border-gray-800 pb-3 mb-4">
              <Lock className="h-4 w-4 text-purple-400" />
              <h2 className="text-sm font-bold font-heading text-white">Change Password</h2>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Old Password</label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full rounded-xl bg-gray-950 border border-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl bg-gray-950 border border-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={updatingPassword}
                className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {updatingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : "Change Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
