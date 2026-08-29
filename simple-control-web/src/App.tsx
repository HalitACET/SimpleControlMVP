import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Employees from './pages/Employees';

import Styleguide from './pages/Styleguide';

import AppLayout from './components/layout/AppLayout';
import { ToastProvider } from './components/ui/toast/ToastContext';

function App() {
  const token = localStorage.getItem('token');

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Layout routes */}
          <Route element={<AppLayout />}>
            <Route path="/employees" element={<Employees />} />
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
    </ToastProvider>
  );
}

export default App;
