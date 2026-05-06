import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { Calendar, Clock, Stethoscope, AlertCircle } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const fetchAppointments = async () => {
    setLoading(true);
    // Fetch user's appointments and join with doctor table
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        doctors (
          name,
          specialty
        )
      `)
      .eq('patient_id', user.id)
      .order('start_time', { ascending: true });

    if (error) {
      console.error(error);
    } else {
      setAppointments(data || []);
    }
    setLoading(false);
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) {
      alert('Failed to cancel appointment.');
    } else {
      fetchAppointments();
    }
  };

  if (loading) return <div className="container mt-4">Loading dashboard...</div>;

  return (
    <div className="container dashboard-container">
      <h2 className="title-lg mb-8">Patient Dashboard</h2>

      <div className="dashboard-content">
        <h3 className="title-md mb-4">Your Appointments</h3>
        
        {appointments.length === 0 ? (
          <div className="empty-state text-center p-8 bg-gray-50 rounded border border-gray-200">
            <AlertCircle size={48} className="mx-auto text-muted mb-4" />
            <p className="text-muted mb-4">You have no upcoming appointments.</p>
            <a href="/doctors" className="btn btn-primary">Find a Doctor</a>
          </div>
        ) : (
          <div className="appointments-list">
            {appointments.map(appt => (
              <div key={appt.id} className="appointment-card card">
                <div className="appt-header">
                  <div className="appt-date">
                    <Calendar size={20} className="text-secondary" />
                    <span className="font-medium">{format(new Date(appt.start_time), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className={`badge ${appt.status === 'scheduled' ? 'badge-success' : appt.status === 'cancelled' ? 'badge-danger' : 'badge-default'}`}>
                    {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                  </div>
                </div>
                
                <div className="divider"></div>
                
                <div className="appt-body">
                  <div className="appt-doctor">
                    <Stethoscope size={20} className="text-muted" />
                    <div>
                      <p className="font-medium">{appt.doctors?.name}</p>
                      <p className="text-sm text-muted">{appt.doctors?.specialty}</p>
                    </div>
                  </div>
                  
                  <div className="appt-time">
                    <Clock size={20} className="text-muted" />
                    <span className="font-medium">
                      {format(new Date(appt.start_time), 'h:mm a')} - {format(new Date(appt.end_time), 'h:mm a')}
                    </span>
                  </div>
                </div>

                {appt.status === 'scheduled' && (
                  <div className="appt-footer mt-4 pt-4 border-t text-right">
                    <button 
                      onClick={() => handleCancel(appt.id)}
                      className="btn btn-outline border-danger text-danger hover:bg-danger hover:text-white"
                    >
                      Cancel Appointment
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
