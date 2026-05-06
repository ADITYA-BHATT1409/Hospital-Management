import { Link } from 'react-router-dom';
import { Calendar, Shield, Clock } from 'lucide-react';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="container hero-content">
          <div className="hero-text">
            <h1 className="title-xl">
              Your Health, <br />
              <span className="text-secondary">On Your Schedule</span>
            </h1>
            <p className="subtitle mt-4 mb-8">
              Book appointments with top specialists seamlessly. No double bookings, no waiting in line. Manage your healthcare from anywhere.
            </p>
            <div className="flex gap-4">
              <Link to="/doctors" className="btn btn-primary btn-lg">
                Find a Doctor
              </Link>
              <Link to="/auth" className="btn btn-outline btn-lg">
                Patient Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section container">
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon bg-blue-100 text-blue-600">
              <Calendar size={32} />
            </div>
            <h3 className="title-md mt-4">Smart Booking</h3>
            <p className="text-muted mt-2">
              Our system guarantees no overlapping appointments. See real-time availability.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon bg-green-100 text-green-600">
              <Shield size={32} />
            </div>
            <h3 className="title-md mt-4">Secure Platform</h3>
            <p className="text-muted mt-2">
              Your data is protected with enterprise-grade security and strict privacy policies.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon bg-purple-100 text-purple-600">
              <Clock size={32} />
            </div>
            <h3 className="title-md mt-4">Save Time</h3>
            <p className="text-muted mt-2">
              Skip the waiting room. Book instantly and manage your schedule effortlessly.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
