import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          <Activity size={28} className="logo-icon" />
          <span>HealthSync</span>
        </Link>
        <div className="navbar-links">
          <Link to="/doctors" className="nav-link">Find Doctors</Link>
          {user ? (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <button onClick={handleSignOut} className="btn btn-outline">Sign Out</button>
            </>
          ) : (
            <Link to="/auth" className="btn btn-primary">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
