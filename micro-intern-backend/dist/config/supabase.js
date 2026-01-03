"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STORAGE_BUCKETS = exports.supabase = void 0;
exports.getSupabase = getSupabase;
const supabase_js_1 = require("@supabase/supabase-js");
// Lazy initialization - only creates client when first accessed
let supabaseInstance = null;
function getSupabaseClient() {
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
        supabaseInstance = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL.trim(), serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
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
function getSupabase() {
    return getSupabaseClient();
}
// For backward compatibility, export supabase as a proxy
exports.supabase = new Proxy({}, {
    get(_target, prop) {
        const client = getSupabaseClient();
        const value = client[prop];
        if (typeof value === 'function') {
            return value.bind(client);
        }
        return value;
    },
});
// Storage bucket names
exports.STORAGE_BUCKETS = {
    CERTIFICATES: "certificates",
    JOB_SUBMISSIONS: "job-submissions",
    PROFILE_PICTURES: "profile-pictures",
    COMPANY_LOGOS: "company-logos",
    CHAT_ATTACHMENTS: "chat-attachments",
};
