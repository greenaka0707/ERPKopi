const supabaseUrl = "https://fbutiflsnnfcicenmfvp.supabase.co";

const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZidXRpZmxzbm5mY2ljZW5tZnZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTE0MTIsImV4cCI6MjA5MzYyNzQxMn0.nsl7SIHQoSMV7Fcyi9-X0kJrPqbZeCW8noEbNKWG4PE";

export const db = supabase.createClient(supabaseUrl, supabaseKey);
