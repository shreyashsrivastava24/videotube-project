import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Eye, EyeOff, Loader2, Upload, User } from "lucide-react";

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Previews
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue(fieldName, file);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (fieldName === "avatar") {
          setAvatarPreview(reader.result);
        } else {
          setCoverPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("fullName", data.fullName);
      formData.append("username", data.username);
      formData.append("email", data.email);
      formData.append("password", data.password);
      if (data.avatar) {
        formData.append("avatar", data.avatar);
      }
      if (data.coverImage) {
        formData.append("coverImage", data.coverImage);
      }

      const userCreated = await signup(formData);
      if (userCreated) {
        navigate("/login");
      }
    } catch {
      // Signup error handled by AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold font-heading text-white">Create Account</h2>
        <p className="mt-1.5 text-sm text-gray-400">Join VideoTube to start streaming</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1">
          <label htmlFor="fullName" className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            placeholder="John Doe"
            {...register("fullName", { required: "Full name is required" })}
            className={`w-full rounded-xl bg-gray-900 border px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 ${
              errors.fullName ? "border-red-500 focus:border-red-500" : "border-gray-800 focus:border-purple-500"
            }`}
          />
          {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
        </div>

        {/* Username */}
        <div className="space-y-1">
          <label htmlFor="username" className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
            Username
          </label>
          <input
            id="username"
            type="text"
            placeholder="johndoe"
            {...register("username", {
              required: "Username is required",
              minLength: { value: 3, message: "Must be at least 3 characters" },
              pattern: { value: /^[a-zA-Z0-9_]+$/, message: "Only letters, numbers, and underscores" },
            })}
            className={`w-full rounded-xl bg-gray-900 border px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 ${
              errors.username ? "border-red-500 focus:border-red-500" : "border-gray-800 focus:border-purple-500"
            }`}
          />
          {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label htmlFor="email" className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            placeholder="john@example.com"
            {...register("email", {
              required: "Email is required",
              pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" },
            })}
            className={`w-full rounded-xl bg-gray-900 border px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 ${
              errors.email ? "border-red-500 focus:border-red-500" : "border-gray-800 focus:border-purple-500"
            }`}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label htmlFor="password" className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "Must be at least 6 characters" },
              })}
              className={`w-full rounded-xl bg-gray-900 border px-4 py-2.5 pr-10 text-sm text-white placeholder-gray-500 outline-none transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 ${
                errors.password ? "border-red-500 focus:border-red-500" : "border-gray-800 focus:border-purple-500"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-white"
            >
              {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        {/* Avatar Upload (Required) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
              Avatar Image *
            </label>
            <div className="relative flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-800 bg-gray-900/50 p-3 text-center cursor-pointer hover:border-purple-500 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "avatar")}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar Preview" className="avatar h-12 w-12 border border-purple-500/30" />
              ) : (
                <>
                  <User className="h-5 w-5 text-gray-400 mb-1" />
                  <span className="text-[10px] text-gray-500 font-medium">Click to upload</span>
                </>
              )}
            </div>
            {/* Registered hidden avatar control */}
            <input type="hidden" {...register("avatar", { required: "Avatar image is required" })} />
            {errors.avatar && <p className="text-[10px] text-red-500 mt-1">{errors.avatar.message}</p>}
          </div>

          {/* Cover Image Upload (Optional) */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
              Cover Image
            </label>
            <div className="relative flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-800 bg-gray-900/50 p-3 text-center cursor-pointer hover:border-purple-500 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "coverImage")}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {coverPreview ? (
                <img src={coverPreview} alt="Cover Preview" className="h-12 w-full rounded-lg object-cover border border-purple-500/30" />
              ) : (
                <>
                  <Upload className="h-5 w-5 text-gray-400 mb-1" />
                  <span className="text-[10px] text-gray-500 font-medium">Click to upload</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all duration-200 hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            <span>Sign Up</span>
          )}
        </button>
      </form>

      <div className="text-center text-xs text-gray-400">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-purple-400 hover:text-purple-300">
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default Signup;
