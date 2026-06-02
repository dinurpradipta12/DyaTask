DROP POLICY IF EXISTS "workspace activity logs write" ON public.activity_logs;

CREATE POLICY "workspace activity logs write"
  ON public.activity_logs FOR ALL
  USING (public.workspace_can_write_area(user_id, 'reports'))
  WITH CHECK (public.workspace_can_write_area(user_id, 'reports'));
