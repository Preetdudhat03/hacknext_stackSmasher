-- Supabase DB Schema
-- Voice Biomarker Health Monitoring System MVP

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table (If not using Supabase Auth natively, otherwise this is a profile extension)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email TEXT UNIQUE NOT NULL,
    baseline_score INTEGER DEFAULT 100,
    -- Store basic demographic info which could be used by ML model later
    demographics JSONB DEFAULT '{}'::jsonb
);

-- Voice Logs Table
CREATE TABLE public.voice_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- The audio file reference in Supabase Storage
    audio_file_url TEXT NOT NULL,
    
    -- Extracted features array/json
    extracted_features JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- The insights given by the Explainable AI layer
    system_insights JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Overall calculated score (0-100)
    health_score INTEGER NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high'))
);

-- Alerts Table (For anomaly detection events)
CREATE TABLE public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    voice_log_id UUID REFERENCES public.voice_logs(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- e.g. "Respiratory Alert", "High Tremor Detected"
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE
);

-- Row Level Security Setup
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Note: Configure policies as necessary for your auth flow.
-- For the MVP, we assume local testing or basic authenticated policies.
