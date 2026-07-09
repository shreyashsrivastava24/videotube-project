export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV
    ? "http://localhost:8000/api/v1"
    : "https://videotube-project-backend.onrender.com/api/v1");
