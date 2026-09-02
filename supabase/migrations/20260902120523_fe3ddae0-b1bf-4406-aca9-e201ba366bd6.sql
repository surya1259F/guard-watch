CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid NOT NULL,
  name text NOT NULL,
  manager_code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can find teams by manager code" ON public.teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can create their own teams" ON public.teams FOR INSERT TO authenticated WITH CHECK (auth.uid() = manager_id AND public.has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY "Managers can update their own teams" ON public.teams FOR UPDATE TO authenticated USING (auth.uid() = manager_id AND public.has_role(auth.uid(), 'manager'::app_role)) WITH CHECK (auth.uid() = manager_id AND public.has_role(auth.uid(), 'manager'::app_role));

CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  member_role app_role NOT NULL DEFAULT 'guard'::app_role,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);
GRANT SELECT, INSERT, UPDATE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members and managers can view team members" ON public.team_members FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.manager_id = auth.uid()));
CREATE POLICY "Guards can join a team as themselves" ON public.team_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND member_role = 'guard'::app_role AND EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id));
CREATE POLICY "Managers can manage their team roster" ON public.team_members FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.manager_id = auth.uid() AND public.has_role(auth.uid(), 'manager'::app_role))) WITH CHECK (EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.manager_id = auth.uid() AND public.has_role(auth.uid(), 'manager'::app_role)));

CREATE TABLE public.team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  invited_email text,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.team_invites TO authenticated;
GRANT ALL ON public.team_invites TO service_role;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers can manage invites for their teams" ON public.team_invites FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.manager_id = auth.uid() AND public.has_role(auth.uid(), 'manager'::app_role))) WITH CHECK (EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.manager_id = auth.uid() AND public.has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Authenticated users can read invite tokens" ON public.team_invites FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.validate_team_invite_expiry()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.expires_at <= now() AND TG_OP = 'INSERT' THEN
    RAISE EXCEPTION 'Invite expiry must be in the future';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_team_invite_expiry_before_write
BEFORE INSERT ON public.team_invites
FOR EACH ROW EXECUTE FUNCTION public.validate_team_invite_expiry();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();