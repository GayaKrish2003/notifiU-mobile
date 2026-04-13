import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { initTokenStorage } from "@notifiu/shared";

// Wire web token storage (localStorage)
initTokenStorage({
  getToken: async () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return token.startsWith('"') ? token.slice(1, -1) : token;
  },
  setToken: async (token: string) => localStorage.setItem("token", token),
  removeToken: async () => localStorage.removeItem("token"),
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);