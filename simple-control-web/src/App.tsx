import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { setNavigate } from './api/navigateHelper';
import Login from './pages/Login';
import Employees from './pages/Employees';

import Shifts from './pages/Shifts';
import WorkGroups from './pages/WorkGroups';
import Holidays from './pages/Holidays';
import Scans from './pages/Scans';
import UserAccounts from './pages/UserAccounts';
import Departments from './pages/Departments';
import DepartmentDetail from './pages/DepartmentDetail';
import Locations from './pages/locations/Locations';
import DailyReport from './pages/DailyReport';
import MonthlyReport from './pages/MonthlyReport';
import MonthlyReportDetail from './pages/MonthlyReportDetail';
import Styleguide from './pages/Styleguide';

import AppLayout from './components/layout/AppLayout';
import { ToastProvider } from './components/ui/toast/ToastContext';
import { ConfirmProvider } from './components/ui/confirm/ConfirmDialogContext';

/** BrowserRouter altında çalışıp navigate referansını modül dışına taşır. */
function NavigateInjector() {
  const nav = useNavigate();
  useEffect(() => { setNavigate(nav); }, [nav]);
  return null;
}

function App() {
  const token = localStorage.getItem('token');

  return (
    <ToastProvider>
      <ConfirmProvider>
        <BrowserRouter>
          <NavigateInjector />
          <Routes>
            <Route path="/login" element={<Login />} />
          
          {/* Layout routes */}
          <Route element={<AppLayout />}>
            <Route path="/employees" element={<Employees />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/departments/:id" element={<DepartmentDetail />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/shifts" element={<Shifts />} />
            <Route path="/work-groups" element={<WorkGroups />} />
            <Route path="/holidays" element={<Holidays />} />
            <Route path="/scans" element={<Scans />} />
            <Route path="/users" element={<UserAccounts />} />
            <Route path="/reports/daily" element={<DailyReport />} />
            <Route path="/reports/monthly" element={<MonthlyReport />} />
            <Route path="/reports/monthly/:employeeId" element={<MonthlyReportDetail />} />
            <Route path="/styleguide" element={<Styleguide />} />
          </Route>
          
          <Route
            path="/"
            element={
              token ? <Navigate to="/employees" replace /> : <Navigate to="/login" replace />
            }
          />
        </Routes>
      </BrowserRouter>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;
