
import { createClient } from '@supabase/supabase-js';

// يتم جلب هذه القيم من متغيرات البيئة لضمان الأمان عند الرفع على GitHub
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xmuhxplikeohlutvmntf.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdWh4cGxpa2VvaGx1dHZtbnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNTIwNDQsImV4cCI6MjA4MjgyODA0NH0.K94qX1Qy8g40CjMkIXFuUkCckGYh-dffN970zFBAiw8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
