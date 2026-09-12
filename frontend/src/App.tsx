import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import {
  AuthProvider,
} from "./context/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Activity from "./pages/Activity";
import Tasks from "./pages/Tasks";
import Notifications from "./pages/Notifications";
import Projects from "./pages/Projects";

function App() {
  return (
    <AuthProvider>

      <BrowserRouter>

        <Routes>

          {/* PUBLIC */}
          <Route
            path="/login"
            element={<Login />}
          />

          {/* PROTECTED */}
          <Route
            element={
              <ProtectedRoute />
            }
          >

            <Route
              element={<Layout />}
            >

              <Route
                path="/dashboard"
                element={
                  <Dashboard />
                }
              />

            <Route
  path="/tasks"
  element={<Tasks />}
/>

               <Route
  path="/projects"
  element={<Projects />}
/>

             <Route
  path="/activity"
  element={<Activity />}
/>

             <Route
  path="/notifications"
  element={<Notifications />}
/>

            </Route>

          </Route>

          {/* DEFAULT */}
          <Route
            path="/"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

          <Route
            path="*"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

        </Routes>

      </BrowserRouter>

    </AuthProvider>
  );
}

export default App;