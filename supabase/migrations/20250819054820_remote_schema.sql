
  create policy "service_role_key_presigned_url 1jgvrq_0"
  on "storage"."objects"
  as permissive
  for select
  to service_role
using ((bucket_id = 'audio'::text));



