/*
# Gym Management Database Schema

This migration creates a complete gym/fitness management system with the following tables:

1. **members** - Gym members who can enroll in classes
   - id: UUID primary key
   - name: Member's full name
   - email: Contact email (unique)
   - phone: Phone number
   - gender: Male/Female
   - birth_date: Date of birth
   - join_date: When they joined the gym
   - status: active/inactive
   - created_at: Record creation timestamp

2. **trainers** - Fitness instructors and personal trainers
   - id: UUID primary key
   - name: Trainer's full name
   - email: Contact email (unique)
   - phone: Phone number
   - specialty: Main specialty (e.g., Yoga, CrossFit, Weight Training)
   - experience_years: Years of experience
   - bio: Short biography
   - status: active/inactive
   - created_at: Record creation timestamp

3. **memberships** - Membership plans available
   - id: UUID primary key
   - name: Plan name (e.g., Basic, Premium, VIP)
   - description: Plan details
   - price_monthly: Monthly price
   - duration_months: Duration in months
   - features: JSON array of included features
   - is_active: Whether plan is available for purchase
   - created_at: Record creation timestamp

4. **gym_classes** - Types of fitness classes offered
   - id: UUID primary key
   - name: Class name (e.g., Yoga, Zumba, Spin)
   - description: Class description
   - duration_minutes: Standard class duration
   - difficulty_level: beginner/intermediate/advanced
   - max_capacity: Maximum participants
   - trainer_id: Assigned trainer (optional)
   - is_active: Whether class is currently offered
   - created_at: Record creation timestamp

5. **class_schedules** - Scheduled class sessions
   - id: UUID primary key
   - class_id: Reference to gym_class
   - trainer_id: Trainer for this session
   - schedule_date: Date of the class
   - start_time: Start time
   - end_time: End time
   - room: Room/location
   - capacity: Max spots for this session
   - enrolled_count: Current enrollments
   - status: scheduled/completed/cancelled
   - created_at: Record creation timestamp

6. **enrollments** - Member enrollments in scheduled classes
   - id: UUID primary key
   - member_id: Reference to member
   - schedule_id: Reference to class_schedule
   - enrolled_at: When they enrolled
   - status: enrolled/attended/cancelled
   - created_at: Record creation timestamp

7. **member_memberships** - Track member membership purchases
   - id: UUID primary key
   - member_id: Reference to member
   - membership_id: Reference to membership plan
   - start_date: When membership starts
   - end_date: When membership ends
   - status: active/expired/cancelled
   - created_at: Record creation timestamp

Security:
- RLS enabled on all tables
- All tables use anon + authenticated policies (single-tenant, no auth required)
- Full CRUD access for both anon and authenticated roles
*/

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  birth_date date,
  join_date date DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_members" ON members;
CREATE POLICY "anon_select_members" ON members FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_members" ON members;
CREATE POLICY "anon_insert_members" ON members FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_members" ON members;
CREATE POLICY "anon_update_members" ON members FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_members" ON members;
CREATE POLICY "anon_delete_members" ON members FOR DELETE
  TO anon, authenticated USING (true);

-- Trainers table
CREATE TABLE IF NOT EXISTS trainers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  specialty text,
  experience_years integer DEFAULT 0,
  bio text,
  photo_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_trainers" ON trainers;
CREATE POLICY "anon_select_trainers" ON trainers FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_trainers" ON trainers;
CREATE POLICY "anon_insert_trainers" ON trainers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_trainers" ON trainers;
CREATE POLICY "anon_update_trainers" ON trainers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_trainers" ON trainers;
CREATE POLICY "anon_delete_trainers" ON trainers FOR DELETE
  TO anon, authenticated USING (true);

-- Memberships table
CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_monthly decimal(10,2) NOT NULL DEFAULT 0,
  duration_months integer NOT NULL DEFAULT 1,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_memberships" ON memberships;
CREATE POLICY "anon_select_memberships" ON memberships FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_memberships" ON memberships;
CREATE POLICY "anon_insert_memberships" ON memberships FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_memberships" ON memberships;
CREATE POLICY "anon_update_memberships" ON memberships FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_memberships" ON memberships;
CREATE POLICY "anon_delete_memberships" ON memberships FOR DELETE
  TO anon, authenticated USING (true);

-- Gym Classes table
CREATE TABLE IF NOT EXISTS gym_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  duration_minutes integer NOT NULL DEFAULT 60,
  difficulty_level text CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  max_capacity integer DEFAULT 20,
  trainer_id uuid REFERENCES trainers(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gym_classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_gym_classes" ON gym_classes;
CREATE POLICY "anon_select_gym_classes" ON gym_classes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_gym_classes" ON gym_classes;
CREATE POLICY "anon_insert_gym_classes" ON gym_classes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_gym_classes" ON gym_classes;
CREATE POLICY "anon_update_gym_classes" ON gym_classes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_gym_classes" ON gym_classes;
CREATE POLICY "anon_delete_gym_classes" ON gym_classes FOR DELETE
  TO anon, authenticated USING (true);

-- Class Schedules table
CREATE TABLE IF NOT EXISTS class_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES gym_classes(id) ON DELETE CASCADE,
  trainer_id uuid REFERENCES trainers(id) ON DELETE SET NULL,
  schedule_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  room text,
  capacity integer DEFAULT 20,
  enrolled_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_class_schedules" ON class_schedules;
CREATE POLICY "anon_select_class_schedules" ON class_schedules FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_class_schedules" ON class_schedules;
CREATE POLICY "anon_insert_class_schedules" ON class_schedules FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_class_schedules" ON class_schedules;
CREATE POLICY "anon_update_class_schedules" ON class_schedules FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_class_schedules" ON class_schedules;
CREATE POLICY "anon_delete_class_schedules" ON class_schedules FOR DELETE
  TO anon, authenticated USING (true);

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  schedule_id uuid NOT NULL REFERENCES class_schedules(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'attended', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(member_id, schedule_id)
);

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_enrollments" ON enrollments;
CREATE POLICY "anon_select_enrollments" ON enrollments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_enrollments" ON enrollments;
CREATE POLICY "anon_insert_enrollments" ON enrollments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_enrollments" ON enrollments;
CREATE POLICY "anon_update_enrollments" ON enrollments FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_enrollments" ON enrollments;
CREATE POLICY "anon_delete_enrollments" ON enrollments FOR DELETE
  TO anon, authenticated USING (true);

-- Member Memberships table
CREATE TABLE IF NOT EXISTS member_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  membership_id uuid NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE member_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_member_memberships" ON member_memberships;
CREATE POLICY "anon_select_member_memberships" ON member_memberships FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_member_memberships" ON member_memberships;
CREATE POLICY "anon_insert_member_memberships" ON member_memberships FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_member_memberships" ON member_memberships;
CREATE POLICY "anon_update_member_memberships" ON member_memberships FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_member_memberships" ON member_memberships;
CREATE POLICY "anon_delete_member_memberships" ON member_memberships FOR DELETE
  TO anon, authenticated USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_trainers_status ON trainers(status);
CREATE INDEX IF NOT EXISTS idx_gym_classes_active ON gym_classes(is_active);
CREATE INDEX IF NOT EXISTS idx_class_schedules_date ON class_schedules(schedule_date);
CREATE INDEX IF NOT EXISTS idx_enrollments_member ON enrollments(member_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_schedule ON enrollments(schedule_id);
CREATE INDEX IF NOT EXISTS idx_member_memberships_member ON member_memberships(member_id);
CREATE INDEX IF NOT EXISTS idx_member_memberships_status ON member_memberships(status);
