-- Seed data for daily challenges
INSERT INTO daily_challenges (id, challenge_text, challenge_date, created_at)
VALUES 
    (uuid_generate_v4(), 'Put your phone face-down for 10 minutes', CURRENT_DATE, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'Write down three things you are grateful for today', CURRENT_DATE + INTERVAL '1 day', CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'Take 5 deep breaths and focus on the present moment', CURRENT_DATE + INTERVAL '2 days', CURRENT_TIMESTAMP)
ON CONFLICT (challenge_date) DO NOTHING;

