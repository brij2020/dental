// src/App.tsx
import { RouterProvider } from "react-router-dom";
import router from "./routes/Router";
import AuthProvider from "./state/auth"; 
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <ToastContainer position="top-right" autoClose={2500} newestOnTop theme="colored" />
    </AuthProvider>
  );
}