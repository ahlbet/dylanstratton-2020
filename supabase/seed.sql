-- Seed file for local Supabase development
-- This file will populate your local database with sample data for testing

-- Note: Sequences are managed automatically by Supabase
-- and will start from appropriate values.

-- Insert sample daily entries
INSERT INTO public.daily (title, coherency_level, cover_art, date) VALUES
('25may25', 85, 'https://example.com/cover-art-1.jpg', '2025-05-25'),
('25may20', 78, 'https://example.com/cover-art-2.jpg', '2025-05-20'),
('25may16', 92, 'https://example.com/cover-art-3.jpg', '2025-05-16'),
('25may14', 67, 'https://example.com/cover-art-4.jpg', '2025-05-14'),
('25may13', 89, 'https://example.com/cover-art-5.jpg', '2025-05-13'),
('25may12', 76, 'https://example.com/cover-art-6.jpg', '2025-05-12'),
('25may09', 83, 'https://example.com/cover-art-7.jpg', '2025-05-09'),
('25may05', 91, 'https://example.com/cover-art-8.jpg', '2025-05-05'),
('24nov10', 74, 'https://example.com/cover-art-9.jpg', '2024-11-10'),
('24nov05', 88, 'https://example.com/cover-art-10.jpg', '2024-11-05');

-- Insert sample daily_audio entries
INSERT INTO public.daily_audio (daily_id, storage_path, duration, format, coherency_level) VALUES
(1, 'audio/25may25-1.wav', 180, 'audio/wav', 85),
(1, 'audio/25may25-2.wav', 210, 'audio/wav', 85),
(2, 'audio/25may20-1.wav', 195, 'audio/wav', 78),
(3, 'audio/25may16-1.wav', 165, 'audio/wav', 92),
(4, 'audio/25may14-1.wav', 240, 'audio/wav', 67),
(5, 'audio/25may13-1.wav', 180, 'audio/wav', 89),
(6, 'audio/25may12-1.wav', 200, 'audio/wav', 76),
(7, 'audio/25may09-1.wav', 175, 'audio/wav', 83),
(8, 'audio/25may05-1.wav', 190, 'audio/wav', 91),
(9, 'audio/24nov10-1.wav', 220, 'audio/wav', 74),
(10, 'audio/24nov05-1.wav', 185, 'audio/wav', 88);

-- Insert sample markov_texts entries
INSERT INTO public.markov_texts (text_content, text_length, metadata, edited, coherency_level, daily_id) VALUES
('The rain fell softly on the cobblestone streets, each drop a whisper of forgotten memories. Shadows danced between the lampposts, their movements choreographed by the wind. Somewhere in the distance, a piano played a melancholic melody that seemed to echo through time itself.', 189, '{"mood": "melancholic", "theme": "rain", "style": "poetic"}', false, 85, 1),
('Through the window, I watched the world pass by in a blur of colors and motion. Each person carried their own story, their own dreams and disappointments. The city was alive with possibility, yet somehow felt empty at its core.', 156, '{"mood": "contemplative", "theme": "urban", "style": "observational"}', false, 78, 2),
('The old bookstore smelled of leather and dust, a comforting aroma that spoke of countless hours spent among pages. Each book held worlds within worlds, stories that had been told and retold across generations. I ran my fingers along the spines, feeling the weight of human imagination.', 178, '{"mood": "nostalgic", "theme": "books", "style": "descriptive"}', false, 92, 3),
('Morning light filtered through the curtains, painting golden patterns on the wooden floor. The house was quiet except for the gentle hum of the refrigerator and the distant sound of birds greeting the new day. I sat with my coffee, watching the world wake up.', 165, '{"mood": "peaceful", "theme": "morning", "style": "serene"}', false, 67, 4),
('The concert hall was filled with anticipation, the air thick with the promise of music. When the first note sounded, it seemed to fill every corner of the space, vibrating through the audience like an electric current. We were all connected in that moment.', 172, '{"mood": "excited", "theme": "music", "style": "dramatic"}', false, 89, 5),
('Walking through the forest, I felt the earth beneath my feet and the canopy above my head. The trees seemed to whisper secrets to each other, their branches swaying in a dance older than human memory. Nature had its own rhythm, its own language.', 158, '{"mood": "reverent", "theme": "nature", "style": "contemplative"}', false, 76, 6),
('The kitchen was warm with the smell of baking bread, a scent that brought back childhood memories of my grandmother''s house. She would hum while she worked, her hands moving with practiced ease. I tried to recreate her recipe, but something was always missing.', 175, '{"mood": "nostalgic", "theme": "family", "style": "personal"}', false, 83, 7),
('The ocean stretched endlessly before me, its surface catching the light in a thousand different ways. Waves crashed against the shore with a rhythm that felt ancient and eternal. I stood there, feeling small in the face of such vastness.', 142, '{"mood": "awe", "theme": "ocean", "style": "poetic"}', false, 91, 8),
('The train rattled through the countryside, each click of the tracks marking our progress toward the city. Through the window, I watched fields and forests blur past, each landscape a different chapter in the story of the land.', 134, '{"mood": "contemplative", "theme": "travel", "style": "observational"}', false, 74, 9),
('The library was a sanctuary of knowledge, its shelves lined with the accumulated wisdom of centuries. Students hunched over books, their faces illuminated by the soft glow of desk lamps. Here, time seemed to stand still.', 138, '{"mood": "reverent", "theme": "learning", "style": "descriptive"}', false, 88, 10);

-- Note: Storage buckets are typically created automatically by Supabase
-- or through the dashboard. We'll focus on table data seeding here.

-- Note: Indexes are typically created by migrations or can be added manually
-- through Supabase Studio if needed for performance.

-- Insert some additional sample data for testing different scenarios
INSERT INTO public.daily (title, coherency_level, cover_art, date) VALUES
('24sep18', 95, 'https://example.com/cover-art-11.jpg', '2024-09-18'),
('24jun30', 82, 'https://example.com/cover-art-12.jpg', '2024-06-30'),
('24jun26', 79, 'https://example.com/cover-art-13.jpg', '2024-06-26'),
('24jun17', 87, 'https://example.com/cover-art-14.jpg', '2024-06-17'),
('24jun16', 93, 'https://example.com/cover-art-15.jpg', '2024-06-16');

-- Add more markov texts for the new entries
INSERT INTO public.markov_texts (text_content, text_length, metadata, edited, coherency_level, daily_id) VALUES
('The stars burned bright in the night sky, each one a distant sun with its own story to tell. I lay on the grass, feeling the earth beneath me and the vastness above. In that moment, I understood what it meant to be both insignificant and infinite.', 167, '{"mood": "philosophical", "theme": "cosmos", "style": "contemplative"}', false, 95, 11),
('The coffee shop buzzed with conversation and the sound of espresso machines. People sat alone with laptops or gathered in groups, each creating their own little world within the larger space. The air was thick with caffeine and creativity.', 145, '{"mood": "energetic", "theme": "urban", "style": "observational"}', false, 82, 12),
('The garden was a riot of color and life, each flower competing for attention in the summer sun. Bees buzzed from bloom to bloom, their work essential to the cycle of growth and renewal. I knelt in the soil, feeling connected to something ancient.', 156, '{"mood": "peaceful", "theme": "nature", "style": "descriptive"}', false, 79, 13),
('The old bridge spanned the river with quiet dignity, its stone arches reflecting in the water below. Generations had crossed here, each leaving their mark on the worn path. The bridge had stories to tell if anyone would listen.', 138, '{"mood": "reverent", "theme": "history", "style": "poetic"}', false, 87, 14),
('The mountain rose before us, its peak hidden in clouds that seemed to touch the sky. The climb would be challenging, but the view from the top would make every step worthwhile. We began our ascent as the sun painted the rocks in golden light.', 149, '{"mood": "determined", "theme": "adventure", "style": "dramatic"}', false, 93, 15);

-- Add more audio files for the new entries
INSERT INTO public.daily_audio (daily_id, storage_path, duration, format, coherency_level) VALUES
(11, 'audio/24sep18-1.wav', 205, 'audio/wav', 95),
(12, 'audio/24jun30-1.wav', 190, 'audio/wav', 82),
(13, 'audio/24jun26-1.wav', 175, 'audio/wav', 79),
(14, 'audio/24jun17-1.wav', 200, 'audio/wav', 87),
(15, 'audio/24jun16-1.wav', 185, 'audio/wav', 93);

-- Create a function to get random markov texts (useful for testing)
CREATE OR REPLACE FUNCTION get_random_markov_texts(limit_count integer DEFAULT 5)
RETURNS TABLE(
    id integer,
    text_content text,
    text_length integer,
    coherency_level integer,
    daily_id bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT mt.id, mt.text_content, mt.text_length, mt.coherency_level, mt.daily_id
    FROM public.markov_texts mt
    ORDER BY random()
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get daily posts with audio count
CREATE OR REPLACE FUNCTION get_daily_with_audio_count()
RETURNS TABLE(
    id bigint,
    title text,
    date date,
    coherency_level integer,
    audio_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.title,
        d.date,
        d.coherency_level,
        COUNT(da.id)::bigint as audio_count
    FROM public.daily d
    LEFT JOIN public.daily_audio da ON d.id = da.daily_id
    GROUP BY d.id, d.title, d.date, d.coherency_level
    ORDER BY d.date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Function permissions are typically handled by Supabase automatically
-- in local development. These functions will be available to all users.

-- Insert some test users for authentication testing (optional)
-- Note: In a real seed file, you might want to create actual user accounts
-- This is just for demonstration purposes

-- Create a test profile for the default user (if you want to test with auth)
-- INSERT INTO public.profiles (id, username, full_name, avatar_url)
-- VALUES (
--     '00000000-0000-0000-0000-000000000000',
--     'testuser',
--     'Test User',
--     'https://example.com/avatar.jpg'
-- );

-- Print summary of seeded data
DO $$
DECLARE
    daily_count integer;
    audio_count integer;
    markov_count integer;
BEGIN
    SELECT COUNT(*) INTO daily_count FROM public.daily;
    SELECT COUNT(*) INTO audio_count FROM public.daily_audio;
    SELECT COUNT(*) INTO markov_count FROM public.markov_texts;
    
    RAISE NOTICE 'Seed data inserted successfully:';
    RAISE NOTICE '- Daily entries: %', daily_count;
    RAISE NOTICE '- Audio files: %', audio_count;
    RAISE NOTICE '- Markov texts: %', markov_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Your local Supabase instance is now ready for development!';
    RAISE NOTICE 'You can access Supabase Studio at: http://localhost:54323';
    RAISE NOTICE 'API endpoint: http://localhost:54321';
    RAISE NOTICE 'Database connection: postgresql://postgres:postgres@localhost:54322/postgres';
END $$;
