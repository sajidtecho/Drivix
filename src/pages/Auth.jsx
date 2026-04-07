import React, { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, MapPin, ArrowRight, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    city: ''
  });
  const [rememberMe, setRememberMe] = useState(false);

  // Load saved email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('drivix_remembered_email');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);


  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Real Login
        await signInWithEmailAndPassword(auth, formData.email, formData.password);

        // Handle Remember Me
        if (rememberMe) {
          localStorage.setItem('drivix_remembered_email', formData.email);
        } else {
          localStorage.removeItem('drivix_remembered_email');
        }

        navigate('/find');
      } else {

        // Real Signup
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        // Create user profile in Firestore
        await setDoc(doc(db, "users", user.uid), {
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          city: formData.city,
          vehicles: [],
          documents: [],
          walletBalance: 0,
          createdAt: new Date().toISOString()
        });

        navigate('/find');
      }
    } catch (err) {
      console.error(err);
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('Please enter your email address first to reset your password.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, formData.email);
      alert('Password reset link has been sent to your email.');
    } catch (err) {
      console.error(err);
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '100px', paddingBottom: '60px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '40px', position: 'relative', overflow: 'hidden' }}>

        {/* Toggle tabs */}
        <div style={{ display: 'flex', marginBottom: '32px', background: 'var(--glass-border)', padding: '4px', borderRadius: 'var(--radius-input)' }}>
          <button
            onClick={() => setIsLogin(true)}
            style={{
              flex: 1, padding: '10px', borderRadius: 'var(--radius-button)', border: 'none',
              background: isLogin ? 'var(--accent-primary)' : 'transparent',
              color: isLogin ? '#000' : 'var(--text-secondary)',
              fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s'
            }}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            style={{
              flex: 1, padding: '10px', borderRadius: 'var(--radius-button)', border: 'none',
              background: !isLogin ? 'var(--accent-primary)' : 'transparent',
              color: !isLogin ? '#000' : 'var(--text-secondary)',
              fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s'
            }}
          >
            Sign Up
          </button>
        </div>

        <h2 style={{ fontSize: '2rem', marginBottom: '8px', fontWeight: 700 }}>
          {isLogin ? 'Your spot is waiting.' : 'Reserve yours.'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          {isLogin ? 'Log in to manage your bookings and wallet.' : 'Create an account to secure premium parking across the city.'}
        </p>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(255, 75, 75, 0.1)', border: '1px solid rgba(255, 75, 75, 0.3)', borderRadius: 'var(--radius-input)', color: '#ff4b4b', fontSize: '0.9rem', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {!isLogin && (
            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-primary)' }} />
                <input
                  type="text" name="name" placeholder="Full Name" required
                  value={formData.name} onChange={handleChange}
                  style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: 'var(--radius-input)', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none' }}
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-primary)' }} />
              <input
                type="email" name="email" placeholder="Email Address" required
                value={formData.email} onChange={handleChange}
                style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: 'var(--radius-input)', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none' }}
              />
            </div>
          </div>

          {!isLogin && (
            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Mobile Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-primary)' }} />
                <input
                  type="tel" name="mobile" placeholder="+91........." required
                  value={formData.mobile} onChange={handleChange}
                  style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: 'var(--radius-input)', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none' }}
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-primary)' }} />
              <input
                type={showPassword ? "text" : "password"} name="password" placeholder="Password" required
                value={formData.password} onChange={handleChange}
                style={{ width: '100%', padding: '14px 44px 14px 44px', borderRadius: 'var(--radius-input)', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>City / Location</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-primary)' }} />
                <input
                  type="text" name="city" placeholder="City/Location" required
                  value={formData.city} onChange={handleChange}
                  style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: 'var(--radius-input)', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none' }}
                />
              </div>
            </div>
          )}

          {/* Remember Me Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
              <div
                onClick={() => setRememberMe(!rememberMe)}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  border: `2px solid ${rememberMe ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
                  background: rememberMe ? 'var(--accent-primary)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  padding: '2px'
                }}
              >
                {rememberMe && <CheckCircle size={14} color="#000" />}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: rememberMe ? 'var(--text-primary)' : 'var(--text-secondary)' }}>Remember me</span>
            </label>

            {isLogin && (
              <button type="button" onClick={handleForgotPassword} className="nav-link" style={{ fontSize: '0.85rem', padding: 0 }}>Forgot Password?</button>
            )}
          </div>


          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{ marginTop: '12px', width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Log In' : 'Create Account')}
            {!isLoading && <ArrowRight size={18} />}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            By continuing, you agree to our Terms and Privacy Policy.
          </p>
        </form>
      </div>
    </div>
  );
};

export default Auth;
