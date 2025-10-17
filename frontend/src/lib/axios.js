import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? "http://localhost:5000/api" : "https://mern-ecommerce-1-doat.onrender.com/api"),
  withCredentials: true, // ✅ INI YANG PALING PENTING
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ INTERCEPTOR UNTUK DEBUG
axiosInstance.interceptors.request.use(
  (config) => {
    console.log("🚀 Axios Request:", {
      url: `${config.baseURL}${config.url}`, //config.url, (sebelumnya)
      method: config.method,
      withCredentials: config.withCredentials,
    });
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => {
    console.log("✅ Axios Response:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.log("❌ Axios Error:", {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message,
    });
    return Promise.reject(error);
  }
);

export default axiosInstance;
