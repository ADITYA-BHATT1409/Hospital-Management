import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { format, parse, addMinutes, isBefore, isAfter, startOfDay, endOfDay, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, User } from 'lucide-react';
import './BookingModal.css';

const BookingModal = () => {
  const { doctorId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDoctorAndAvailability();
  }, [doctorId, selectedDate]);

  const fetchDoctorAndAvailability = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch doctor details
      const { data: docData, error: docError } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', doctorId)
        .single();
        
      if (docError) throw docError;
      setDoctor(docData);

      // 2. Fetch existing appointments for the selected date
      const selectedDayStart = new Date(selectedDate);
      selectedDayStart.setHours(0, 0, 0, 0);
      const selectedDayEnd = new Date(selectedDate);
      selectedDayEnd.setHours(23, 59, 59, 999);

      const { data: appts, error: apptError } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', doctorId)
        .gte('start_time', selectedDayStart.toISOString())
        .lte('start_time', selectedDayEnd.toISOString())
        .neq('status', 'cancelled');

      if (apptError) throw apptError;

      // 3. Generate slots and filter availability
      generateSlots(docData, appts || [], selectedDate);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch availability.');
    } finally {
      setLoading(false);
    }
  };

  const generateSlots = (doc, appointments, dateStr) => {
    const slots = [];
    // Parse working hours
    const startTimeStr = `${dateStr}T${doc.working_hours_start}`;
    const endTimeStr = `${dateStr}T${doc.working_hours_end}`;
    
    let currentSlot = new Date(startTimeStr);
    const endTime = new Date(endTimeStr);
    const now = new Date();

    while (isBefore(currentSlot, endTime)) {
      const slotStart = new Date(currentSlot);
      const slotEnd = addMinutes(currentSlot, doc.consultation_duration_minutes);

      // Check if slot is in the past
      const isPast = isBefore(slotStart, now);

      // Check if slot overlaps with any existing appointment
      const isBooked = appointments.some(appt => {
        const apptStart = new Date(appt.start_time);
        const apptEnd = new Date(appt.end_time);
        return (isBefore(slotStart, apptEnd) && isAfter(slotEnd, apptStart));
      });

      if (!isPast && !isBooked) {
        slots.push({
          start: slotStart,
          end: slotEnd,
          label: format(slotStart, 'hh:mm a')
        });
      }
      currentSlot = slotEnd;
    }

    setAvailableSlots(slots);
    setSelectedSlot(null);
  };

  const handleBooking = async () => {
    if (!selectedSlot) return;
    setBookingLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('appointments')
        .insert({
          doctor_id: doctorId,
          patient_id: user.id,
          start_time: selectedSlot.start.toISOString(),
          end_time: selectedSlot.end.toISOString(),
          status: 'scheduled'
        });

      // We might catch a postgres error if the EXCLUDE constraint triggers (someone else booked it just now)
      if (insertError) {
        if (insertError.code === '23P01') {
          throw new Error('This time slot was just booked by someone else. Please select another slot.');
        }
        throw insertError;
      }

      alert('Appointment booked successfully!');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while booking.');
      // Refresh slots
      fetchDoctorAndAvailability();
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading && !doctor) return <div className="container mt-4">Loading...</div>;
  if (!doctor) return <div className="container mt-4">Doctor not found.</div>;

  return (
    <div className="container booking-container">
      <div className="booking-layout">
        {/* Doctor Info Panel */}
        <div className="doctor-panel card">
          <div className="text-center mb-4">
            <div className="avatar-large mx-auto bg-blue-100 text-blue-600">
              <User size={48} />
            </div>
            <h2 className="title-md mt-4">{doctor.name}</h2>
            <p className="badge badge-success inline-block mt-2">{doctor.specialty}</p>
          </div>
          <div className="divider"></div>
          <div className="info-row">
            <span className="text-muted">Working Hours:</span>
            <span className="font-medium">{doctor.working_hours_start.slice(0,5)} - {doctor.working_hours_end.slice(0,5)}</span>
          </div>
          <div className="info-row mt-2">
            <span className="text-muted">Consultation:</span>
            <span className="font-medium">{doctor.consultation_duration_minutes} min</span>
          </div>
        </div>

        {/* Booking Panel */}
        <div className="selection-panel card">
          <h3 className="title-md mb-4 flex items-center gap-2">
            <CalendarIcon size={20} className="text-secondary" /> 
            Select Date & Time
          </h3>

          {error && <div className="alert-error">{error}</div>}

          <div className="form-group mb-8">
            <label>Date</label>
            <input 
              type="date" 
              value={selectedDate} 
              min={format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <h4 className="font-medium mb-4">Available Time Slots</h4>
          {loading ? (
             <div className="text-muted">Calculating availability...</div>
          ) : (
            <div className="slots-grid">
              {availableSlots.length === 0 ? (
                <div className="col-span-full text-muted p-4 text-center rounded" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                  No availability on this date. Please select another date.
                </div>
              ) : (
                availableSlots.map((slot, idx) => (
                  <button 
                    key={idx}
                    className={`slot-btn ${selectedSlot === slot ? 'selected' : ''}`}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {slot.label}
                  </button>
                ))
              )}
            </div>
          )}

          <div className="mt-8 pt-4 border-t">
            <button 
              className="btn btn-primary w-full btn-lg" 
              disabled={!selectedSlot || bookingLoading}
              onClick={handleBooking}
            >
              {bookingLoading ? 'Confirming...' : 'Confirm Appointment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
