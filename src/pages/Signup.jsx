import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Sparkles, AlertCircle, Coins, CheckCircle } from 'lucide-react';

export const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [classLevel, setClassLevel] = useState('12th');
  const [selectedSubjects, setSelectedSubjects] = useState(['Physics', 'Mathematics']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const availableSubjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'IOT & Robotics',
    'Artificial Intelligence',
    'Machine Learning',
    'Data Science',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Cybersecurity',
    'History',
    'Geography',
    'Economics',
    'Political Science',
    'Psychology',
    'Sociology',
    'Philosophy',
    'Literature',
    'English'
  ];

  const toggleSubject = (sub) => {
    if (selectedSubjects.includes(sub)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== sub));
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await signup({
        name,
        email,
        password,
        classLevel,
        subjects: selectedSubjects
      });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="form-container" style={{ width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div 
            style={{ 
              width: '52px', 
              height: '52px', 
              background: 'linear-gradient(135deg, #10b981, #059669)', 
              borderRadius: 'var(--radius-md)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 12px',
              color: 'white'
            }}
          >
            <UserPlus size={28} />
          </div>
          <h2 className="form-title">Join Peer-Earn Community</h2>
          <p className="form-subtitle">Create your student account &amp; receive an instant 100 KP starting stake!</p>
          
          <div 
            style={{ 
              background: 'var(--kp-gold-light)', 
              color: 'var(--kp-gold-dark)', 
              padding: '8px 14px', 
              borderRadius: 'var(--radius-full)', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              fontSize: '0.85rem',
              fontWeight: 700,
              border: '1px solid #fde68a'
            }}
          >
            <Coins size={16} color="#f59e0b" />
            <span>Bonus: 100 Knowledge Points (KP) credited immediately</span>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Aarav Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">School / College Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. yourname@peerearn.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password (min 6 characters)</label>
            <input
              type="password"
              className="form-input"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Academic Class / Level</label>
            <select
              className="form-input"
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value)}
            >
              <option value="10th">10th Grade / Secondary</option>
              <option value="11th">11th Grade / High School Junior</option>
              <option value="12th">12th Grade / Senior</option>
              <option value="college">College / University Undergrad</option>
              <option value="postgrad">Postgraduate / Masters</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Favorite Subjects (What you can help with):</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
              {availableSubjects.map((sub) => {
                const isSelected = selectedSubjects.includes(sub);
                return (
                  <button
                    type="button"
                    key={sub}
                    onClick={() => toggleSubject(sub)}
                    className="btn"
                    style={{
                      fontSize: '0.8rem',
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-full)',
                      background: isSelected ? 'var(--primary)' : '#f1f5f9',
                      color: isSelected ? '#ffffff' : '#334155',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid #e2e8f0'
                    }}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '10px' }}
            disabled={loading}
          >
            <UserPlus size={18} />
            <span>{loading ? 'Creating Account...' : 'Join Peer-Earn (+100 KP)'}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
