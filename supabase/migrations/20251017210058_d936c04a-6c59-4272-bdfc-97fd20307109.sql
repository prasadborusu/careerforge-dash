-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('student', 'educator', 'recruiter', 'admin');

-- Create course difficulty enum
CREATE TYPE public.course_difficulty AS ENUM ('beginner', 'intermediate', 'advanced');

-- Create application status enum
CREATE TYPE public.application_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  thumbnail_url TEXT,
  video_url TEXT,
  educator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  difficulty course_difficulty DEFAULT 'beginner',
  duration_hours INTEGER,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create course enrollments
CREATE TABLE public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  enrolled_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ,
  UNIQUE(course_id, student_id)
);

-- Create events (hackathons) table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  banner_url TEXT,
  organizer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  registration_deadline TIMESTAMPTZ NOT NULL,
  max_participants INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create event registrations
CREATE TABLE public.event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status application_status DEFAULT 'pending',
  registered_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(event_id, student_id)
);

-- Create internships table
CREATE TABLE public.internships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  duration_months INTEGER,
  stipend TEXT,
  recruiter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  application_deadline TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create internship applications
CREATE TABLE public.internship_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status application_status DEFAULT 'pending',
  cover_letter TEXT,
  resume_url TEXT,
  applied_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(internship_id, student_id)
);

-- Create user streaks table
CREATE TABLE public.user_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "User roles viewable by everyone"
  ON public.user_roles FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for courses
CREATE POLICY "Published courses viewable by everyone"
  ON public.courses FOR SELECT
  USING (is_published = true OR educator_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Educators can create courses"
  ON public.courses FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'educator') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Educators can update own courses"
  ON public.courses FOR UPDATE
  USING (educator_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Educators can delete own courses"
  ON public.courses FOR DELETE
  USING (educator_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for enrollments
CREATE POLICY "Students can view own enrollments"
  ON public.course_enrollments FOR SELECT
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can enroll in courses"
  ON public.course_enrollments FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own enrollments"
  ON public.course_enrollments FOR UPDATE
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for events
CREATE POLICY "Active events viewable by everyone"
  ON public.events FOR SELECT
  USING (is_active = true OR organizer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Recruiters can create events"
  ON public.events FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'recruiter') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Organizers can update own events"
  ON public.events FOR UPDATE
  USING (organizer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Organizers can delete own events"
  ON public.events FOR DELETE
  USING (organizer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for event registrations
CREATE POLICY "Students can view own registrations"
  ON public.event_registrations FOR SELECT
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'recruiter'));

CREATE POLICY "Students can register for events"
  ON public.event_registrations FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- RLS Policies for internships
CREATE POLICY "Active internships viewable by everyone"
  ON public.internships FOR SELECT
  USING (is_active = true OR recruiter_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Recruiters can create internships"
  ON public.internships FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'recruiter') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Recruiters can update own internships"
  ON public.internships FOR UPDATE
  USING (recruiter_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Recruiters can delete own internships"
  ON public.internships FOR DELETE
  USING (recruiter_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for internship applications
CREATE POLICY "Students can view own applications"
  ON public.internship_applications FOR SELECT
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'recruiter'));

CREATE POLICY "Students can apply for internships"
  ON public.internship_applications FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Recruiters can update applications"
  ON public.internship_applications FOR UPDATE
  USING (public.has_role(auth.uid(), 'recruiter') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for streaks
CREATE POLICY "Users can view own streaks"
  ON public.user_streaks FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own streaks"
  ON public.user_streaks FOR ALL
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_courses_educator ON public.courses(educator_id);
CREATE INDEX idx_courses_published ON public.courses(is_published);
CREATE INDEX idx_enrollments_student ON public.course_enrollments(student_id);
CREATE INDEX idx_enrollments_course ON public.course_enrollments(course_id);
CREATE INDEX idx_events_active ON public.events(is_active);
CREATE INDEX idx_internships_active ON public.internships(is_active);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);