import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogIn,
  Sparkles,
  AlertCircle,
  GraduationCap,
  Mail,
  Lock,
  Chrome,
  Eye,
  EyeOff,
  ArrowLeft
} from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const {
    login,
    forgotPassword,
    signInWithGoogle,
    isLiveFirebase
  } = useAuth();

  const navigate = useNavigate();

  // =========================================================
  // EMAIL + PASSWORD LOGIN
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await login(email.trim(), password);

      navigate('/');
    } catch (err) {

      console.error('Login error:', err);

      let message =
        err?.message ||
        'Failed to sign in. Please verify your credentials.';

      // Firebase-friendly messages
      if (err?.code === 'auth/invalid-credential') {
        message = 'Invalid email or password.';
      }

      if (err?.code === 'auth/user-not-found') {
        message = 'No account was found with this email.';
      }

      if (err?.code === 'auth/wrong-password') {
        message = 'Incorrect password.';
      }

      if (err?.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      }

      if (err?.code === 'auth/too-many-requests') {
        message =
          'Too many login attempts. Please try again later.';
      }

      setError(message);

    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FORGOT PASSWORD
  // =========================================================

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError(
        'Please enter your email address first.'
      );
      return;
    }

    setResetLoading(true);

    try {

      const result =
        await forgotPassword(email.trim());

      setSuccess(
        result?.message ||
        'Password reset email sent. Please check your inbox.'
      );

    } catch (err) {

      console.error(
        'Password reset error:',
        err
      );

      let message =
        err?.message ||
        'Unable to send password reset email.';

      if (err?.code === 'auth/user-not-found') {
        message =
          'No account was found with this email.';
      }

      if (err?.code === 'auth/invalid-email') {
        message =
          'Please enter a valid email address.';
      }

      if (err?.code === 'auth/too-many-requests') {
        message =
          'Too many requests. Please try again later.';
      }

      setError(message);

    } finally {
      setResetLoading(false);
    }
  };

  // =========================================================
  // GOOGLE SIGN-IN
  // =========================================================

  const handleGoogleLogin = async () => {

    setError('');
    setSuccess('');
    setGoogleLoading(true);

    try {

      await signInWithGoogle();

      navigate('/');

    } catch (err) {

      console.error(
        'Google Sign-In error:',
        err
      );

      let message =
        err?.message ||
        'Google Sign-In failed. Please try again.';

      if (
        err?.code ===
        'auth/popup-closed-by-user'
      ) {
        message =
          'Google Sign-In was cancelled.';
      }

      if (
        err?.code ===
        'auth/popup-blocked'
      ) {
        message =
          'The Google login popup was blocked by your browser. Please allow popups for this site.';
      }

      if (
        err?.code ===
        'auth/account-exists-with-different-credential'
      ) {
        message =
          'An account already exists with this email using another sign-in method.';
      }

      setError(message);

    } finally {
      setGoogleLoading(false);
    }
  };

  // =========================================================
  // QUICK DEMO LOGIN
  // =========================================================

  const handleQuickLogin = (
    demoEmail,
    demoPass
  ) => {

    setEmail(demoEmail);
    setPassword(demoPass);

    setError('');
    setSuccess('');
    setShowForgotPassword(false);
  };

  // =========================================================
  // FORGOT PASSWORD SCREEN
  // =========================================================

  if (showForgotPassword) {

    return (
      <div
        className="main-content"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >

        <div
          className="form-container"
          style={{
            width: '100%'
          }}
        >

          {/* HEADER */}

          <div
            style={{
              textAlign: 'center',
              marginBottom: '24px'
            }}
          >

            <div
              style={{
                width: '52px',
                height: '52px',
                background:
                  'linear-gradient(135deg, var(--primary), #818cf8)',
                borderRadius:
                  'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                color: 'white'
              }}
            >
              <Lock size={28} />
            </div>

            <h2 className="form-title">
              Reset Your Password
            </h2>

            <p className="form-subtitle">
              Enter your registered email and we'll
              send you a password reset link.
            </p>

          </div>

          {/* ERROR */}

          {error && (
            <div
              style={{
                background: '#fee2e2',
                color: '#b91c1c',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.9rem'
              }}
            >
              <AlertCircle size={16} />

              <span>
                {error}
              </span>
            </div>
          )}

          {/* SUCCESS */}

          {success && (
            <div
              style={{
                background: '#dcfce7',
                color: '#166534',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '16px',
                fontSize: '0.9rem',
                lineHeight: 1.5
              }}
            >
              ✅ {success}
            </div>
          )}

          <form
            onSubmit={handleForgotPassword}
          >

            <div className="form-group">

              <label className="form-label">
                Email Address
              </label>

              <div
                style={{
                  position: 'relative'
                }}
              >

                <Mail
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform:
                      'translateY(-50%)',
                    color:
                      'var(--text-muted)'
                  }}
                />

                <input
                  type="email"
                  className="form-input"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  style={{
                    paddingLeft: '40px'
                  }}
                  required
                />

              </div>

            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px'
              }}
              disabled={resetLoading}
            >

              <Mail size={18} />

              <span>
                {resetLoading
                  ? 'Sending Reset Email...'
                  : 'Send Reset Link'}
              </span>

            </button>

          </form>

          <button
            type="button"
            className="btn btn-outline"
            style={{
              width: '100%',
              marginTop: '12px',
              padding: '11px'
            }}
            onClick={() => {
              setShowForgotPassword(false);
              setError('');
              setSuccess('');
            }}
          >

            <ArrowLeft size={17} />

            <span>
              Back to Sign In
            </span>

          </button>

        </div>

      </div>
    );
  }

  // =========================================================
  // NORMAL LOGIN SCREEN
  // =========================================================

  return (
    <div
      className="main-content"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >

      <div
        className="form-container"
        style={{
          width: '100%'
        }}
      >

        {/* HEADER */}

        <div
          style={{
            textAlign: 'center',
            marginBottom: '24px'
          }}
        >

          <div
            style={{
              width: '52px',
              height: '52px',
              background:
                'linear-gradient(135deg, var(--primary), #818cf8)',
              borderRadius:
                'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: 'white'
            }}
          >
            <GraduationCap size={30} />
          </div>

          <h2 className="form-title">
            Welcome Back to Peer-Earn
          </h2>

          <p className="form-subtitle">
            Sign in to solve doubts, stake Knowledge
            Points, and learn with peers.
          </p>

        </div>

        {/* ERROR */}

        {error && (
          <div
            style={{
              background: '#fee2e2',
              color: '#b91c1c',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.9rem'
            }}
          >

            <AlertCircle size={16} />

            <span>
              {error}
            </span>

          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div
            style={{
              background: '#dcfce7',
              color: '#166534',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '16px',
              fontSize: '0.9rem'
            }}
          >
            ✅ {success}
          </div>
        )}

        {/* EMAIL + PASSWORD LOGIN */}

        <form onSubmit={handleSubmit}>

          {/* EMAIL */}

          <div className="form-group">

            <label className="form-label">
              School / College Email
            </label>

            <div
              style={{
                position: 'relative'
              }}
            >

              <Mail
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform:
                    'translateY(-50%)',
                  color:
                    'var(--text-muted)'
                }}
              />

              <input
                type="email"
                className="form-input"
                placeholder="e.g. sachin@peerearn.edu"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                style={{
                  paddingLeft: '40px'
                }}
                required
              />

            </div>

          </div>

          {/* PASSWORD */}

          <div className="form-group">

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px'
              }}
            >

              <label
                className="form-label"
                style={{
                  marginBottom: 0
                }}
              >
                Password
              </label>

              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(true);
                  setError('');
                  setSuccess('');
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--primary)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Forgot Password?
              </button>

            </div>

            <div
              style={{
                position: 'relative'
              }}
            >

              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform:
                    'translateY(-50%)',
                  color:
                    'var(--text-muted)'
                }}
              />

              <input
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                style={{
                  paddingLeft: '40px',
                  paddingRight: '42px'
                }}
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform:
                    'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  color:
                    'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                aria-label={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
              >

                {showPassword
                  ? <EyeOff size={18} />        
                  : <Eye size={18} />
                }

              </button>

            </div>

          </div>

          {/* SIGN IN */}

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '12px'
            }}
            disabled={loading}
          >

            <LogIn size={18} />

            <span>
              {loading
                ? 'Authenticating...'
                : 'Sign In'}
            </span>

          </button>

        </form>

        {/* GOOGLE SIGN-IN */}

        {isLiveFirebase && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                margin: '20px 0',
                color: 'var(--text-muted)',
                fontSize: '0.82rem'
              }}
            >

              <div
                style={{
                  flex: 1,
                  height: '1px',
                  background:
                    'var(--border-color)'
                }}
              />

              <span>
                OR
              </span>

              <div
                style={{
                  flex: 1,
                  height: '1px',
                  background:
                    'var(--border-color)'
                }}
              />

            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="btn btn-outline"
              style={{
                width: '100%',
                padding: '11px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '9px'
              }}
              disabled={
                loading ||
                googleLoading
              }
            >

              <Chrome size={18} />

              <span>
                {googleLoading
                  ? 'Signing in with Google...'
                  : 'Continue with Google'}
              </span>

            </button>
          </>
        )}

        {/* DEMO ACCOUNTS */}

        {!isLiveFirebase && (
          <div
            style={{
              marginTop: '24px',
              paddingTop: '18px',
              borderTop:
                '1px dashed var(--border-color)'
            }}
          >

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                marginBottom: '10px'
              }}
            >

              <Sparkles
                size={14}
                color="#f59e0b"
              />

              <span>
                <strong>
                  Quick Demo Fill
                  (Pre-seeded Students):
                </strong>
              </span>

            </div>

            <div
              style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}
            >

              <button
                type="button"
                className="btn btn-outline"
                style={{
                  fontSize: '0.8rem',
                  padding: '6px 10px'
                }}
                onClick={() =>
                  handleQuickLogin(
                    'aryan@peerearn.edu',
                    'password123'
                  )
                }
              >
                Aaryan (12th Grade - Asker)
              </button>

              <button
                type="button"
                className="btn btn-outline"
                style={{
                  fontSize: '0.8rem',
                  padding: '6px 10px'
                }}
                onClick={() =>
                  handleQuickLogin(
                    'Arshdeep@peerearn.edu',
                    'password123'
                  )
                }
              >
                Arshdeep (12th Grade - Solver)
              </button>

            </div>

          </div>
        )}

        {/* SIGNUP */}

        <div
          style={{
            textAlign: 'center',
            marginTop: '20px',
            fontSize: '0.9rem',
            color: 'var(--text-muted)'
          }}
        >

          Don't have an account yet?{' '}

          <Link
            to="/signup"
            style={{
              color: 'var(--primary)',
              fontWeight: 600
            }}
          >
            Create student profile (+100 KP Free)
          </Link>

        </div>

      </div>

    </div>
  );
};

export default Login;
