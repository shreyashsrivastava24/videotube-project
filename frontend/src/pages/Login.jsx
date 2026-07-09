import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const success = await login(data.emailOrUsername, data.password);
      if (success) {
        navigate("/");
      }
    } catch {
      // Login error handled by AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold font-heading text-white">Welcome Back</h2>
        <p className="mt-1.5 text-sm text-gray-400">Sign in to your VideoTube account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email or Username */}
        <div className="space-y-1">
          <label htmlFor="emailOrUsername" className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
            Email or Username
          </label>
          <input
            id="emailOrUsername"
            type="text"
            placeholder="Enter your email or username"
            {...register("emailOrUsername", {
              required: "Email or username is required",
              minLength: { value: 3, message: "Must be at least 3 characters" },
            })}
            className={`w-full rounded-xl bg-gray-900 border px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 ${
              errors.emailOrUsername ? "border-red-500 focus:border-red-500" : "border-gray-800 focus:border-purple-500"
            }`}
          />
          {errors.emailOrUsername && (
            <p className="text-xs text-red-500 mt-1">{errors.emailOrUsername.message}</p>
          )}
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
              placeholder="Enter your password"
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "Password must be at least 6 characters" },
              })}
              className={`w-full rounded-xl bg-gray-900 border px-4 py-3 pr-10 text-sm text-white placeholder-gray-500 outline-none transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 ${
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
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all duration-200 hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      <div className="text-center text-xs text-gray-400">
        Don't have an account?{" "}
        <Link to="/signup" className="font-semibold text-purple-400 hover:text-purple-300">
          Sign Up
        </Link>
      </div>
    </div>
  );
};

export default Login;
