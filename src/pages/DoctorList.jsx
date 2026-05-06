import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Stethoscope, Clock } from 'lucide-react';
import './DoctorList.css';

const DoctorList = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      const { data, error } = await supabase.from('doctors').select('*');
      if (error) {
        console.error('Error fetching doctors:', error);
      } else {
        setDoctors(data || []);
      }
      setLoading(false);
    };

    fetchDoctors();
  }, []);

  if (loading) return <div className="container mt-4">Loading doctors...</div>;

  return (
    <div className="container">
      <div className="doctor-header mb-8 text-center">
        <h2 className="title-lg">Our Specialists</h2>
        <p className="subtitle">Select a doctor to view their availability and book an appointment.</p>
      </div>

      {doctors.length === 0 ? (
        <div className="text-center text-muted">No doctors found. Please add some via the Supabase database.</div>
      ) : (
        <div className="doctor-grid">
          {doctors.map(doctor => (
            <div key={doctor.id} className="doctor-card card">
              <div className="doctor-info">
                <div className="doctor-avatar bg-blue-100 text-blue-600">
                  <Stethoscope size={32} />
                </div>
                <div>
                  <h3 className="title-md">{doctor.name}</h3>
                  <span className="badge badge-success mt-2 inline-block">{doctor.specialty}</span>
                </div>
              </div>
              
              <div className="doctor-meta mt-4 mb-4">
                <div className="meta-item text-muted">
                  <Clock size={18} />
                  <span>{doctor.working_hours_start.slice(0,5)} - {doctor.working_hours_end.slice(0,5)}</span>
                </div>
              </div>
              
              <Link to={`/book/${doctor.id}`} className="btn btn-primary w-full">
                Check Availability
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorList;
