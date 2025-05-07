import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Provider } from "react-redux"
import { store } from "./store"
import Login from "./features/auth/Login"
import Register from "./features/auth/Register"
import Dashboard from "./components/Dashboard/Dashboard"
import { PrivateRoute } from "./routes/PrivateRoute"
import { Toaster } from "./components/ui/toaster"
import AgentTestingPage from "./pages/AgentTestingPage"

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/agent-testing" element={<AgentTestingPage />} />
            {/* Add other protected routes here */}
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </Router>
    </Provider>
  )
}

export default App

