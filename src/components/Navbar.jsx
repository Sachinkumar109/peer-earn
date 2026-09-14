import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import KPBadge from './KPBadge';
import { GraduationCap, PlusCircle, Star, User, LogOut, BookOpen } from 'lucide-react';

export const Navbar = () => {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="navbar">
      <div className="nav-inner">
        {/* Brand */}
        <Link to="/" className="brand-logo">
          <div className="brand-icon-wrapper">
            <GraduationCap size={22} />
          </div>
          <div>
            <span>Peer-Earn</span>
            <span style={{ fontSize: '0.65rem', display: 'block', color: 'var(--primary)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Learn &amp; Earn
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="nav-links">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Explore Doubts
          </Link>

          {userProfile && (
            <Link 
              to="/raise" 
              className={`btn btn-primary ${location.pathname === '/raise' ? 'active' : ''}`}
              style={{ padding: '7px 14px', fontSize: '0.88rem' }}
            >
              <PlusCircle size={16} />
              <span>Raise Doubt</span>
            </Link>
          )}
        </nav>

        {/* User Stats / Profile Area */}
        <div className="user-stats-bar">
          {userProfile ? (
            <>
              <KPBadge amount={userProfile.kpBalance} animated={true} />

              <div className="reputation-chip" title="Scholar Reputation Score">
                <Star size={14} style={{ color: '#eab308', fill: '#eab308' }} />
                <span>{userProfile.reputation ?? 0}</span>
              </div>

              <Link 
                to="/profile" 
                className="btn btn-outline" 
                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                title="View Profile & Rewards"
              >
                <User size={15} />
                <span>{userProfile.name?.split(' ')[0]}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ({userProfile.classLevel})
                </span>
              </Link>

              <button
                onClick={handleLogout}
                className="btn btn-outline"
                style={{ padding: '6px 10px' }}
                title="Sign Out"
              >
                <LogOut size={16} color="#64748b" />
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to="/login" className="btn btn-outline">Log In</Link>
              <Link to="/signup" className="btn btn-primary">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
