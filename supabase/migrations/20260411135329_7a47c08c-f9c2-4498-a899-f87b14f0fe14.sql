
-- Fix checkpoint policies
DROP POLICY "Authenticated can update checkpoints" ON public.checkpoints;
DROP POLICY "Authenticated can insert checkpoints" ON public.checkpoints;
CREATE POLICY "Guards and managers can update checkpoints" ON public.checkpoints FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'guard') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Guards and managers can insert checkpoints" ON public.checkpoints FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'guard') OR public.has_role(auth.uid(), 'manager'));

-- Fix alert insert policy
DROP POLICY "Authenticated can insert alerts" ON public.alerts;
CREATE POLICY "Guards and managers can insert alerts" ON public.alerts FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'guard') OR public.has_role(auth.uid(), 'manager'));
