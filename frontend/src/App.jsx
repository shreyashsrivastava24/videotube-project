import React from "react";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1E293B",
            color: "#F8FAFC",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          },
          success: {
            iconTheme: {
              primary: "#A855F7",
              secondary: "#F8FAFC",
            },
          },
        }}
      />
    </AuthProvider>
  );
}

export default App;
