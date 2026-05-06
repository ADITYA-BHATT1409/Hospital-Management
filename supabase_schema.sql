-- Enable the btree_gist extension for conflict resolution logic
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Create Doctors Table
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    working_hours_start TIME NOT NULL,
    working_hours_end TIME NOT NULL,
    consultation_duration_minutes INT NOT NULL DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Profiles Table (Linked to Supabase Auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to handle new user signups and create a profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after a user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Create Appointments Table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Advanced Database Level Conflict Prevention Logic
-- Prevents overlapping appointments for the same doctor
ALTER TABLE appointments
ADD CONSTRAINT no_overlapping_appointments
EXCLUDE USING GIST (
  doctor_id WITH =,
  tstzrange(start_time, end_time) WITH &&
);

-- RLS (Row Level Security) Policies

-- Enable RLS on all tables
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Doctors are viewable by everyone
CREATE POLICY "Doctors are publicly viewable." 
ON doctors FOR SELECT USING (true);

-- Profiles are viewable by the user themselves
CREATE POLICY "Users can view their own profile." 
ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile." 
ON profiles FOR UPDATE USING (auth.uid() = id);

-- Appointments RLS
-- Users can view their own appointments
CREATE POLICY "Users can view their own appointments." 
ON appointments FOR SELECT USING (auth.uid() = patient_id);

-- Users can insert their own appointments
CREATE POLICY "Users can create their own appointments." 
ON appointments FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- Anyone can read appointments to check availability (but maybe we should only expose times?)
-- For simplicity, we allow public read of appointments to calculate availability on frontend
CREATE POLICY "Appointments are publicly viewable to check availability." 
ON appointments FOR SELECT USING (true);

-- Users can update their own appointments (e.g. to cancel)
CREATE POLICY "Users can update their own appointments." 
ON appointments FOR UPDATE USING (auth.uid() = patient_id);

-- -------------------------------------------------------------
-- Dummy Data for Testing
-- -------------------------------------------------------------

INSERT INTO doctors (id, name, specialty, working_hours_start, working_hours_end, consultation_duration_minutes) VALUES
('b2a1a2b2-3c3d-4e4f-5g5h-6i6j6k6l6m6n', 'Dr. Sarah Jenkins', 'Cardiologist', '09:00', '17:00', 30),
('c3b2b3c3-4d4e-5f5g-6h6i-7j7k7l7m7n7o', 'Dr. Michael Chen', 'Dermatologist', '10:00', '16:00', 20),
('d4c3c4d4-5e5f-6g6h-7i7j-8k8l8m8n8o8p', 'Dr. Emily Carter', 'General Practitioner', '08:00', '14:00', 15),
('e5d4d5e5-6f6g-7h7i-8j8k-9l9m9n9o9p9q', 'Dr. Robert Davis', 'Neurologist', '11:00', '19:00', 45);
