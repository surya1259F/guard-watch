
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('guard', 'manager');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'guard',
  status TEXT NOT NULL DEFAULT 'offline',
  last_seen TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'guard')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.user_id, NEW.role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_role();

-- Checkpoints table
CREATE TABLE public.checkpoints (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  last_scanned TIMESTAMPTZ,
  last_scanned_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.checkpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Checkpoints readable by authenticated" ON public.checkpoints FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can update checkpoints" ON public.checkpoints FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can insert checkpoints" ON public.checkpoints FOR INSERT TO authenticated WITH CHECK (true);

-- Patrol logs table
CREATE TABLE public.patrol_logs (
  id TEXT PRIMARY KEY,
  guard_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guard_name TEXT NOT NULL,
  checkpoint_id TEXT NOT NULL REFERENCES public.checkpoints(id),
  checkpoint_name TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  synced BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patrol_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guards can insert own logs" ON public.patrol_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = guard_id);
CREATE POLICY "All authenticated can read logs" ON public.patrol_logs FOR SELECT TO authenticated USING (true);

-- GPS tracking table
CREATE TABLE public.gps_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guard_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  guard_name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_moving BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'offline'
);
ALTER TABLE public.gps_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guards can upsert own GPS" ON public.gps_tracking FOR INSERT TO authenticated WITH CHECK (auth.uid() = guard_id);
CREATE POLICY "Guards can update own GPS" ON public.gps_tracking FOR UPDATE TO authenticated USING (auth.uid() = guard_id);
CREATE POLICY "All authenticated can read GPS" ON public.gps_tracking FOR SELECT TO authenticated USING (true);

-- Incidents table
CREATE TABLE public.incidents (
  id TEXT PRIMARY KEY,
  guard_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guard_name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guards can insert own incidents" ON public.incidents FOR INSERT TO authenticated WITH CHECK (auth.uid() = guard_id);
CREATE POLICY "All authenticated can read incidents" ON public.incidents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can update incidents" ON public.incidents FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'manager'));

-- Alerts table
CREATE TABLE public.alerts (
  id TEXT PRIMARY KEY,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'LOW',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  dismissed BOOLEAN NOT NULL DEFAULT false,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated can read alerts" ON public.alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert alerts" ON public.alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Managers can update alerts" ON public.alerts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'manager'));

-- Seed default checkpoints
INSERT INTO public.checkpoints (id, name, location, lat, lng) VALUES
  ('gate-a', 'Gate A', 'Main Entrance', 40.7128, -74.006),
  ('gate-b', 'Gate B', 'East Wing', 40.7138, -74.005),
  ('server-room', 'Server Room', 'Building B, Floor 2', 40.7118, -74.007),
  ('parking-north', 'Parking Lot North', 'North Campus', 40.7148, -74.004),
  ('reception', 'Reception Lobby', 'Main Building', 40.7125, -74.0065),
  ('rooftop', 'Rooftop', 'Main Building Top', 40.7132, -74.0055);
