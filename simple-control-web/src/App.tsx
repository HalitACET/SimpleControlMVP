import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Employees from './pages/Employees';

import Shifts from './pages/Shifts';
import WorkGroups from './pages/WorkGroups';
import Holidays from './pages/Holidays';
import Styleguide from './pages/Styleguide';

import AppLayout from './components/layout/AppLayout';
import { ToastProvider } from './components/ui/toast/ToastContext';
import { ConfirmProvider } from './components/ui/confirm/ConfirmDialogContext';

function App() {
  const token = localStorage.getItem('token');

  return (
    <ToastProvider>
      <ConfirmProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
          
          {/* Layout routes */}
          <Route element={<AppLayout />}>
            <Route path="/employees" element={<Employees />} />
            <Route path="/shifts" element={<Shifts />} />
            <Route path="/work-groups" element={<WorkGroups />} />
            <Route path="/holidays" element={<Holidays />} />
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
