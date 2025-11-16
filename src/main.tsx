import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Clear all authentication data on app load
localStorage.clear();
sessionStorage.clear();

createRoot(document.getElementById("root")!).render(<App />);
