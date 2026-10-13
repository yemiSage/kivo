-- Keep the deployed media bucket aligned with Kivo's client-side upload limit.
update storage.buckets
set file_size_limit = 5242880
where id = 'media';
