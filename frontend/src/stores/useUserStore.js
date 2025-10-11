import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useUserStore = create((set, get) => ({
  user: null,
  loading: false,
  checkingAuth: true,

  signup: async (formData) => {
    set({ loading: true });

    if (formData.password !== formData.confirmPassword) {
      set({ loading: false });
      return toast.error("Passwords do not match");
    }

    try {
      const userData = { ...formData };
      delete userData.confirmPassword;
      const res = await axios.post("/auth/signup", userData);
      set({ user: res.data, loading: false });
      toast.success("Account created successful!");
    } catch (error) {
      set({ loading: false });
      toast.error(error.response.data.message || "An error occurred");
    }
  },
  login: async (email, password) => {
    set({ loading: true });
    try {
      console.log("🔐 Attempting login...");
      const res = await axios.post("/auth/login", { email, password });

      const { accessToken, refreshToken, ...userData } = res.data; // ✅ userData akan dipakai
      if (accessToken) localStorage.setItem("accessToken", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

      const profileResponse = await axios.get("/auth/profile");
      console.log("✅ Profile:", profileResponse.data);

      set({ user: userData, loading: false }); // ✅ gunakan userData
      toast.success("Login successful!");
    } catch (error) {
      console.log("❌ Login failed:", error.message);
      set({ loading: false });
      toast.error(error.response?.data?.message || "Login failed");
    }
  },

  logout: async () => {
    try {
      await axios.post("/auth/logout");
      set({ user: null });
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "An error occurred during logout"
      );
    }
  },

  checkAuth: async () => {
    set({ checkingAuth: true });
    try {
      console.log("🔐 checkAuth - Checking token...");
      const token = localStorage.getItem("accessToken");
      console.log("🔑 Token from localStorage:", !!token);

      if (!token) {
        throw new Error("No token found in localStorage");
      }

      // ✅ PASTIKAN MENGGUNAKAN AUTHORIZATION HEADER
      const response = await axios.get("/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("✅ Auth check successful:", response.data);
      set({ user: response.data, checkingAuth: false });
    } catch (error) {
      console.log("❌ Auth check failed:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      // Clear invalid token
      localStorage.removeItem("accessToken");
      set({ checkingAuth: false, user: null });
    }
  },

  // Helper function untuk check admin
  isAdmin: () => {
    const user = get().user;
    return user && user.role === "admin";
  },

  refreshToken: async () => {
    // Prevent multiple simultaneous refresh attempts
    if (get().checkingAuth) return;

    set({ checkingAuth: true });
    try {
      const response = await axios.post("/auth/refresh-token");
      set({ checkingAuth: false });
      return response.data;
    } catch (error) {
      set({ user: null, checkingAuth: false });
      throw error;
    }
  },
}));

// TODO: Implement the axios interceptors for refreshing access token

// Axios interceptor for token refresh
let refreshPromise = null;

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // If a refresh is already in progress, wait for it to complete
        if (refreshPromise) {
          await refreshPromise;
          return axios(originalRequest);
        }

        // Start a new refresh process
        refreshPromise = useUserStore.getState().refreshToken();
        await refreshPromise;
        refreshPromise = null;

        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login or handle as needed
        useUserStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
