import React, { useState } from 'react';

function Register({ onRegister, onSwitchToLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        onRegister(data.user);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
  };

  return (
    <div className="card">
      <h1 className="brand-title">SyncSpace</h1>
      <p className="brand-subtitle">Create your account to start collaborating</p>
      
      {error && <p className="error-text">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          className="input-field"
          placeholder="Choose a Username" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          required 
        />
        <div className="password-container">
            <input 
              type={showPassword ? "text" : "password"} 
              className="input-field"
              placeholder="Choose a Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
            <button 
                type="button" 
                className="password-toggle-btn" 
                onClick={togglePasswordVisibility}
                title={showPassword ? "Hide password" : "Show password"}
            >
                {showPassword ? '🙈' : '👁️'}
            </button>
        </div>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Registering...' : 'Sign Up'}
        </button>
      </form>
      <button className="btn-secondary" onClick={onSwitchToLogin}>
        Already have an account? Sign in
      </button>
    </div>
  );
}

export default Register;