import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Tickets from "./pages/Tickets";


function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/tickets" replace />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/tickets"
        element={
          <PrivateRoute>
            <Tickets />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}