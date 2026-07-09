import React, { createContext, useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { getErrorMessage } from "../utils";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get("/users/current-user");
      // Mongoose ApiResponse structure returns { statusCode, data, message, success }
      setUser(response.data?.data || null);
    } catch (error) {
      setUser(null);
      // Clean tokens if unauthorized
      if (error.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    const handleAuthExpired = () => {
      setUser(null);
      toast.error("Session expired. Please log in again.");
    };

    window.addEventListener("auth-expired", handleAuthExpired);
    return () => {
      window.removeEventListener("auth-expired", handleAuthExpired);
    };
  }, []);


  const login = async (emailOrUsername, password) => {
    try {
      const response = await api.post("/users/login", {
        // Backend handles both username or email, but checks req.body for email or username
        email: emailOrUsername.includes("@") ? emailOrUsername : undefined,
        username: !emailOrUsername.includes("@") ? emailOrUsername : undefined,
        password,
      });

      const data = response.data?.data;
      if (data) {
        setUser(data.user);
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        toast.success(response.data?.message || "Logged in successfully!");
        return true;
      }
      return false;
    } catch (error) {
      toast.error(getErrorMessage(error, "Login failed. Please check your credentials."));
      throw error;
    }
  };

  const signup = async (formData) => {
    try {
      const response = await api.post("/users/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success(response.data?.message || "Registration successful! You can now log in.");
      return response.data?.data;
    } catch (error) {
      toast.error(getErrorMessage(error, "Registration failed."));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post("/users/logout");
    } catch {
      // Logout request failed — still clear local session
    } finally {
      setUser(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      toast.success("Logged out successfully");
    }
  };

  const updateAccount = async (fullName, email) => {
    try {
      const response = await api.patch("/users/update-account", { fullName, email });
      setUser(response.data?.data);
      toast.success("Account details updated successfully");
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update account details."));
      throw error;
    }
  };

  const updateAvatar = async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      const response = await api.patch("/users/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setUser(response.data?.data);
      toast.success("Avatar updated successfully");
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update avatar."));
      throw error;
    }
  };

  const updateCoverImage = async (file) => {
    const formData = new FormData();
    formData.append("coverImage", file);
    try {
      const response = await api.patch("/users/cover-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setUser(response.data?.data);
      toast.success("Cover image updated successfully");
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update cover image."));
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        updateAccount,
        updateAvatar,
        updateCoverImage,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

