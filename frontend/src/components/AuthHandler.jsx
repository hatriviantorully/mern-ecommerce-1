import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";

export default function AuthHandler() {
  const navigate = useNavigate();
  const { user } = useUserStore();

  useEffect(() => {
    if (!user) return;

    console.log("🔁 Redirecting based on role:", user.role);
    if (user.role === "admin") {
      navigate("/admin");
    } else {
      navigate(import.meta.env.VITE_CLIENT_URL || "/");
    }
  }, [user, navigate]);

  return null;
}
