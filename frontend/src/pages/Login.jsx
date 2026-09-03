import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { setToken, setUser } from '../utils/auth';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData);

      if (response.success) {
        setToken(response.data.token);
        setUser(response.data.user);
        navigate('/dashboard');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left Panel - Branding */}
      <div className="login-left">
        <div className="login-branding">
          <div className="brand-icon">🏢</div>
          <h1>Employee Portal</h1>
          <p>Secure access to your authorized Zoho applications with role-based access control</p>
        </div>

        <div className="features-list">
          <div className="feature-item">
            <div className="feature-icon">🔐</div>
            <span>Secure Authentication</span>
          </div>
          <div className="feature-item">
            <div className="feature-icon">👥</div>
            <span>Role-Based Access Control</span>
          </div>
          <div className="feature-item">
            <div className="feature-icon">📊</div>
            <span>Integrated Zoho Apps</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="login-right">
        <div className="login-form-container">
          <div className="login-header">
            <h2>Welcome Back</h2>
            <p>Sign in to access your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="login-footer">
            <div className="demo-credentials">
              <strong>🎯 Demo Credentials:</strong>
              Admin: admin@company.com / Admin@123<br />
              HR: hr@company.com / Hr@123<br />
              Sales: sales@company.com / Sales@123<br />
              Support: support@company.com / Support@123<br />
              Finance: finance@company.com / Finance@123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
