import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy initialization - only creates client when first accessed
let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    if (!process.env.SUPABASE_URL) {
      throw new Error("SUPABASE_URL is not defined in environment variables. Please check your .env file.");
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables. Please check your .env file.");
    }

    // Create Supabase client with service role key for server-side operations
    // The service_role key bypasses RLS and should work for storage operations
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    
    if (!serviceRoleKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is empty or invalid");
    }

    // Validate service_role key format (should be a JWT)
    if (serviceRoleKey.split(".").length !== 3) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY appears to be invalid. It should be a JWT token with 3 parts separated by dots.");
    }

    supabaseInstance = createClient(
      process.env.SUPABASE_URL.trim(),
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    
    console.log("Supabase client initialized:", {
      url: process.env.SUPABASE_URL.trim(),
      hasServiceRoleKey: !!serviceRoleKey,
      keyLength: serviceRoleKey.length,
      keyPreview: serviceRoleKey.substring(0, 20) + "...",
    });
  }
  return supabaseInstance;
}

// Export a getter function that lazily initializes the client
export function getSupabase(): SupabaseClient {
  return getSupabaseClient();
}

// For backward compatibility, export supabase as a proxy
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

// Storage bucket names
export const STORAGE_BUCKETS = {
  CERTIFICATES: "certificates",
  JOB_SUBMISSIONS: "job-submissions",
  PROFILE_PICTURES: "profile-pictures",
  COMPANY_LOGOS: "company-logos",
  CHAT_ATTACHMENTS: "chat-attachments",
} as const;


