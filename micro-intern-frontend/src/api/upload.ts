type ApiErrorBody = { message?: string };

function getToken(): string | null {
  return localStorage.getItem("mi_token");
}

const BASE = "/api";

export interface UploadResponse {
  success: boolean;
  data?: {
    url: string;
    path: string;
  };
  message?: string;
}

/**
 * Upload a file to the server
 */
export async function uploadFile(
  endpoint: string,
  file: File
): Promise<UploadResponse> {
  let token = getToken();
  
  if (!token) {
    throw new Error("Authentication required. Please log in again.");
  }

  // Trim whitespace and newlines from token
  token = token.trim();

  // Validate token format (basic check)
  if (token.split(".").length !== 3) {
    console.error("Token format invalid:", {
      length: token.length,
      parts: token.split(".").length,
      preview: token.substring(0, 50),
    });
    throw new Error("Invalid authentication token format. Please log out and log in again.");
  }
  
  const formData = new FormData();
  formData.append("file", file);

  // IMPORTANT: Do NOT set Content-Type header when using FormData
  // The browser will automatically set it with the correct boundary
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
  };

  try {
    // Debug: Log token info (first 20 chars only for security)
    console.log("Upload request:", {
      endpoint,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : "none",
      fileSize: file.size,
      fileName: file.name,
    });

    const res = await fetch(`${BASE}${endpoint}`, {
      method: "POST",
      headers,
      body: formData,
    });

    // Handle non-JSON responses
    const contentType = res.headers.get("content-type");
    let body: any;
    
    if (contentType && contentType.includes("application/json")) {
      body = await res.json();
    } else {
      const text = await res.text();
      throw new Error(text || "Upload failed");
    }

    if (!res.ok) {
      const errorMessage = body?.message || body?.error || "Upload failed";
      throw new Error(errorMessage);
    }

    return body as UploadResponse;
  } catch (error) {
    if (error instanceof Error) {
      // Check for specific JWT errors
      if (error.message.includes("Invalid Compact JWS") || error.message.includes("jwt")) {
        throw new Error("Authentication token is invalid. Please log out and log in again.");
      }
      throw error;
    }
    throw new Error("Failed to upload file");
  }
}

/**
 * Upload profile picture
 */
export async function uploadProfilePicture(file: File): Promise<UploadResponse> {
  return uploadFile("/upload/profile-picture", file);
}

/**
 * Upload company logo
 */
export async function uploadCompanyLogo(file: File): Promise<UploadResponse> {
  return uploadFile("/upload/company-logo", file);
}

