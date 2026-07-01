/*
# Seed Sample Data for Gym Management

This migration adds sample data to demonstrate the gym management features:

1. Sample Trainers - 4 trainers with different specialties
2. Sample Members - 6 gym members
3. Sample Memberships - 3 membership tiers (Basic, Premium, VIP)
4. Sample Classes - 5 fitness classes
5. Sample Schedules - Classes scheduled for upcoming week
*/

-- Sample Trainers
INSERT INTO trainers (name, email, phone, specialty, experience_years, bio, status) VALUES
('Mike Johnson', 'mike@gymfit.com', '+1 555-0101', 'Weight Training', 8, 'Certified strength coach with 8 years of experience helping clients achieve their fitness goals.', 'active'),
('Sarah Williams', 'sarah@gymfit.com', '+1 555-0102', 'Yoga', 6, 'RYT-500 certified yoga instructor specializing in Vinyasa and Hatha yoga.', 'active'),
('Carlos Rodriguez', 'carlos@gymfit.com', '+1 555-0103', 'CrossFit', 5, 'CrossFit Level 2 trainer with a passion for high-intensity functional fitness.', 'active'),
('Emma Chen', 'emma@gymfit.com', '+1 555-0104', 'Pilates', 7, 'STOTT Pilates certified instructor focusing on core strength and flexibility.', 'active')
ON CONFLICT (email) DO NOTHING;

-- Sample Members
INSERT INTO members (name, email, phone, gender, birth_date, join_date, status) VALUES
('John Smith', 'john.smith@email.com', '+1 555-0201', 'male', '1990-05-15', '2025-01-10', 'active'),
('Emily Brown', 'emily.b@email.com', '+1 555-0202', 'female', '1995-08-22', '2025-02-15', 'active'),
('David Wilson', 'd.wilson@email.com', '+1 555-0203', 'male', '1988-11-30', '2025-03-01', 'active'),
('Lisa Anderson', 'lisa.a@email.com', '+1 555-0204', 'female', '1992-03-18', '2025-04-20', 'active'),
('Michael Lee', 'm.lee@email.com', '+1 555-0205', 'male', '1985-07-25', '2025-05-05', 'active'),
('Jennifer Taylor', 'j.taylor@email.com', '+1 555-0206', 'female', '1998-12-10', '2025-06-01', 'active')
ON CONFLICT (email) DO NOTHING;

-- Sample Memberships
INSERT INTO memberships (name, description, price_monthly, duration_months, features, is_active) VALUES
('Basic', 'Perfect for beginners starting their fitness journey', 29.99, 1, '["Access to gym floor", "Basic equipment usage", "Locker room access", "2 group classes per month"]'::jsonb, true),
('Premium', 'Great for regular gym-goers who want more', 59.99, 1, '["Full gym access", "All equipment included", "Unlimited group classes", "Sauna & steam room", "1 personal training session/month", "Fitness assessment"]'::jsonb, true),
('VIP', 'The ultimate fitness experience', 99.99, 1, '["24/7 gym access", "All Premium features", "Unlimited personal training", "Nutrition consultation", "Priority class booking", "Free parking", "Guest passes (2/month)"]'::jsonb, true)
ON CONFLICT DO NOTHING;

-- Get trainer IDs for class creation
DO $$
DECLARE
    mike_id uuid;
    sarah_id uuid;
    carlos_id uuid;
    emma_id uuid;
BEGIN
    SELECT id INTO mike_id FROM trainers WHERE email = 'mike@gymfit.com';
    SELECT id INTO sarah_id FROM trainers WHERE email = 'sarah@gymfit.com';
    SELECT id INTO carlos_id FROM trainers WHERE email = 'carlos@gymfit.com';
    SELECT id INTO emma_id FROM trainers WHERE email = 'emma@gymfit.com';

    -- Sample Classes
    INSERT INTO gym_classes (name, description, duration_minutes, difficulty_level, max_capacity, trainer_id, is_active) VALUES
    ('Power Yoga', 'An energetic vinyasa flow that builds strength and flexibility. Suitable for all levels.', 60, 'intermediate', 25, sarah_id, true),
    ('CrossFit WOD', 'Workout of the Day combining varied functional movements at high intensity.', 45, 'advanced', 20, carlos_id, true),
    ('Strength Training 101', 'Learn proper form and technique for basic weightlifting exercises.', 45, 'beginner', 15, mike_id, true),
    ('Pilates Core', 'Focus on core stability, posture, and body awareness through controlled movements.', 50, 'intermediate', 20, emma_id, true),
    ('HIIT Cardio Blast', 'High-intensity interval training to maximize calorie burn and improve endurance.', 30, 'intermediate', 30, carlos_id, true)
    ON CONFLICT DO NOTHING;
END $$;

-- Add some sample schedules for the current week
DO $$
DECLARE
    yoga_id uuid;
    crossfit_id uuid;
    strength_id uuid;
    pilates_id uuid;
    hiit_id uuid;
    mike_id uuid;
    sarah_id uuid;
    carlos_id uuid;
    emma_id uuid;
    schedule_date date;
    day_of_week int;
    i int;
BEGIN
    -- Get class IDs
    SELECT id INTO yoga_id FROM gym_classes WHERE name = 'Power Yoga';
    SELECT id INTO crossfit_id FROM gym_classes WHERE name = 'CrossFit WOD';
    SELECT id INTO strength_id FROM gym_classes WHERE name = 'Strength Training 101';
    SELECT id INTO pilates_id FROM gym_classes WHERE name = 'Pilates Core';
    SELECT id INTO hiit_id FROM gym_classes WHERE name = 'HIIT Cardio Blast';
    
    -- Get trainer IDs
    SELECT id INTO mike_id FROM trainers WHERE email = 'mike@gymfit.com';
    SELECT id INTO sarah_id FROM trainers WHERE email = 'sarah@gymfit.com';
    SELECT id INTO carlos_id FROM trainers WHERE email = 'carlos@gymfit.com';
    SELECT id INTO emma_id FROM trainers WHERE email = 'emma@gymfit.com';
    
    -- Schedule classes for the next 7 days
    FOR i IN 0..6 LOOP
        schedule_date := CURRENT_DATE + i;
        day_of_week := EXTRACT(DOW FROM schedule_date);
        
        -- Morning Yoga (Mon=1, Wed=3, Fri=5)
        IF day_of_week IN (1, 3, 5) THEN
            INSERT INTO class_schedules (class_id, trainer_id, schedule_date, start_time, end_time, room, capacity, status)
            VALUES (yoga_id, sarah_id, schedule_date, '07:00', '08:00', 'Studio A', 25, 'scheduled');
        END IF;
        
        -- CrossFit (Tue=2, Thu=4, Sat=6)
        IF day_of_week IN (2, 4, 6) THEN
            INSERT INTO class_schedules (class_id, trainer_id, schedule_date, start_time, end_time, room, capacity, status)
            VALUES (crossfit_id, carlos_id, schedule_date, '18:00', '18:45', 'Box Area', 20, 'scheduled');
        END IF;
        
        -- Strength Training (Mon=1, Wed=3, Fri=5)
        IF day_of_week IN (1, 3, 5) THEN
            INSERT INTO class_schedules (class_id, trainer_id, schedule_date, start_time, end_time, room, capacity, status)
            VALUES (strength_id, mike_id, schedule_date, '10:00', '10:45', 'Weight Room', 15, 'scheduled');
        END IF;
        
        -- Pilates (Tue=2, Thu=4)
        IF day_of_week IN (2, 4) THEN
            INSERT INTO class_schedules (class_id, trainer_id, schedule_date, start_time, end_time, room, capacity, status)
            VALUES (pilates_id, emma_id, schedule_date, '12:00', '12:50', 'Studio B', 20, 'scheduled');
        END IF;
        
        -- HIIT (every day)
        INSERT INTO class_schedules (class_id, trainer_id, schedule_date, start_time, end_time, room, capacity, status)
        VALUES (hiit_id, carlos_id, schedule_date, '06:30', '07:00', 'Main Floor', 30, 'scheduled');
    END LOOP;
END $$;
