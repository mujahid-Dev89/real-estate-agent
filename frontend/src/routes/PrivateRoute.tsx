import { Navigate, Outlet } from "react-router-dom"
import { useSelector } from "react-redux"
import DashboardLayout from "../components/Dashboard/DashboardLayout"

export const PrivateRoute = () => {
  const { isAuthenticated } = useSelector((state: any) => state.auth)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  )
}

