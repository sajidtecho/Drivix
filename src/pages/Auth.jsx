import React, { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, MapPin, ArrowRight, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, RecaptchaVerifier, signInWithPhoneNumber, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

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

  // Phone Auth State
  const [isPhoneLogin, setIsPhoneLogin] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Terms state
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

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

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response) => {
          // reCAPTCHA solved
        }
      });
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!formData.mobile) {
      setError('Please enter your mobile number with country code (e.g. +91...)');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, formData.mobile, appVerifier);
      setConfirmationResult(result);
      setShowOtpInput(true);
      alert('OTP sent to your mobile number!');
    } catch (err) {
      console.error(err);
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await confirmationResult.confirm(otp);
      navigate('/find');
    } catch (err) {
      console.error(err);
      setError('Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
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

  const TermsModal = () => (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: '20px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto',
        padding: '32px', position: 'relative', border: '1px solid var(--accent-primary)'
      }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', color: 'var(--accent-primary)' }}>Terms & Conditions</h3>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <p><strong>1. Nature of Service:</strong> Drivix provides a digital platform for booking parking spaces. By using this service, you enter into a "License to Occupy" agreement with the parking provider as per the Indian Easements Act, 1882. It is NOT a contract of bailment unless explicitly stated.</p>
          
          <p><strong>2. Insurance & Liability:</strong> In accordance with the Motor Vehicles Act, 1988, all vehicles must have valid Third Party Insurance. Drivix is not liable for theft, loss, or damage to the vehicle or its contents. Users are advised not to leave valuables inside the vehicle.</p>
          
          <p><strong>3. Indian Govt. Policies:</strong> Users must comply with local municipal corporation (e.g., MCD, NDMC, BBMP) bylaws regarding "No Parking" zones and private property usage. Any fines or towing charges incurred due to illegal parking shall be the sole responsibility of the vehicle owner.</p>
          
          <p><strong>4. User Warranty:</strong> You warrant that the vehicle is registered under Indian law, holds a valid PUC (Pollution Under Control) certificate, and you possess a valid Indian Driving License.</p>
          
          <p><strong>5. Safety & Indemnity:</strong> Users agree to indemnify Drivix against any legal claims arising from accidents or disputes within the parking premises.</p>
        </div>
        <button 
          onClick={() => setShowTermsModal(false)}
          className="btn btn-primary"
          style={{ marginTop: '30px', width: '100%' }}
        >
          I Understand
        </button>
      </div>
    </div>
  );

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

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          name: user.displayName || 'Google User',
          email: user.email,
          mobile: user.phoneNumber || '',
          city: '',
          vehicles: [],
          documents: [],
          walletBalance: 0,
          createdAt: new Date().toISOString()
        });
      }
      
      navigate('/find');
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

        {isLogin && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {isPhoneLogin ? "Prefer Email?" : "Prefer Mobile?"}
              <button 
                type="button" 
                onClick={() => { setIsPhoneLogin(!isPhoneLogin); setShowOtpInput(false); setError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 600, marginLeft: '6px', cursor: 'pointer', padding: 0 }}
              >
                {isPhoneLogin ? "Login with Email" : "Login with OTP"}
              </button>
            </span>
          </div>
        )}

        <div id="recaptcha-container"></div>

        {isPhoneLogin && isLogin ? (
          <form onSubmit={showOtpInput ? handleVerifyOtp : handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {!showOtpInput ? (
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
            ) : (
              <div className="input-group">
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Enter OTP</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-primary)' }} />
                  <input
                    type="text" placeholder="123456" required
                    value={otp} onChange={(e) => setOtp(e.target.value)}
                    style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: 'var(--radius-input)', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none', letterSpacing: '2px' }}
                  />
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{ marginTop: '12px', width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : (showOtpInput ? 'Verify OTP' : 'Send OTP')}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>
        ) : (
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

          {/* Terms and Conditions Checkbox */}
          {!isLogin && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '4px' }}>
              <div 
                onClick={() => setAcceptedTerms(!acceptedTerms)}
                style={{
                  width: '20px',
                  height: '20px',
                  minWidth: '20px',
                  borderRadius: '6px',
                  border: `2px solid ${acceptedTerms ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
                  background: acceptedTerms ? 'var(--accent-primary)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  marginTop: '2px'
                }}
              >
                {acceptedTerms && <CheckCircle size={14} color="#000" />}
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                I agree to the <button type="button" onClick={() => setShowTermsModal(true)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', padding: 0, cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>Terms & Conditions</button> which include Indian Govt. parking laws and insurance liability clauses.
              </span>
            </div>
          )}


          <button
            type="submit"
            disabled={isLoading || (!isLogin && !acceptedTerms)}
            className="btn btn-primary"
            style={{ marginTop: '12px', width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: (!isLogin && !acceptedTerms) ? 0.6 : 1 }}
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Log In' : 'Create Account')}
            {!isLoading && <ArrowRight size={18} />}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            By continuing, you agree to our Terms and Privacy Policy.
          </p>
        </form>
        )}

        {showTermsModal && <TermsModal />}

        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
          <span style={{ padding: '0 10px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-input)', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
};

export default Auth;
