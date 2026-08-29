import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

import { handleApiError } from '../utils/errorHandler';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/auth/login', {
        firmId: import.meta.env.VITE_FIRM_ID,
        username,
        password,
      });

      const token = response.data.token;
      if (token) {
        localStorage.setItem('token', token);
        navigate('/employees');
      }
    } catch (err: unknown) {
      setError(handleApiError(err));
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">Login</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
