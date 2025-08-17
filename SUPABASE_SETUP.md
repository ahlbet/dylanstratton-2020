# Supabase Setup Guide

## 1. Environment Variables

Create a `.env` file in your project root with your Supabase credentials:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### How to get these values:

1. **Go to your Supabase project dashboard**
2. **Settings → API** to find your project URL and anon key
3. **Settings → API → service_role key** (keep this secret!)

## 2. Bucket Configuration

Make sure your 'audio' bucket is configured for public access:

1. **Go to Storage → audio bucket**
2. **Settings → Public bucket** should be enabled
3. **Policies → Add policy** for public read access:

```sql
-- Allow public read access to audio files
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'audio');
```

## 3. CORS Configuration

In your Supabase dashboard:

1. **Settings → API → CORS**
2. **Add your domain** (e.g., `https://yourdomain.com`)
3. **For development**: Add `http://localhost:8000` and `http://localhost:9000`
