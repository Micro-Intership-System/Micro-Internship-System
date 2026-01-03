"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = uploadFile;
exports.deleteFile = deleteFile;
exports.getPublicUrl = getPublicUrl;
exports.fileExists = fileExists;
exports.uploadPDF = uploadPDF;
exports.uploadImage = uploadImage;
exports.uploadChatAttachment = uploadChatAttachment;
const supabase_1 = require("../config/supabase");
/**
 * Upload a file to Supabase Storage
 */
async function uploadFile(options) {
    try {
        const { bucket, path, file, contentType, metadata } = options;
        console.log("uploadFile called:", {
            bucket,
            path,
            contentType,
            fileType: Buffer.isBuffer(file) ? "Buffer" : typeof file,
            fileSize: Buffer.isBuffer(file) ? file.length : "unknown",
        });
        // Convert file to Buffer if it's a string or Readable stream
        let fileBuffer;
        if (Buffer.isBuffer(file)) {
            fileBuffer = file;
        }
        else if (typeof file === "string") {
            fileBuffer = Buffer.from(file, "utf-8");
        }
        else {
            // Readable stream - convert to buffer
            const chunks = [];
            for await (const chunk of file) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }
            fileBuffer = Buffer.concat(chunks);
        }
        if (!fileBuffer || fileBuffer.length === 0) {
            console.error("Empty file buffer");
            return {
                success: false,
                error: "File buffer is empty",
            };
        }
        console.log("Uploading to Supabase:", {
            bucket,
            path,
            size: fileBuffer.length,
            contentType,
        });
        // Get the Supabase client directly to ensure we're using service_role
        const supabaseClient = (0, supabase_1.getSupabase)();
        // Upload file using service_role client
        const { data, error } = await supabaseClient.storage
            .from(bucket)
            .upload(path, fileBuffer, {
            contentType: contentType || "application/octet-stream",
            upsert: true, // Overwrite if exists
            metadata: metadata || {},
            cacheControl: '3600',
        });
        if (error) {
            console.error("Supabase upload error:", {
                message: error.message,
                error: error,
            });
            return {
                success: false,
                error: error.message || "Supabase upload failed",
            };
        }
        if (!data) {
            console.error("No data returned from Supabase upload");
            return {
                success: false,
                error: "No data returned from Supabase",
            };
        }
        // Get public URL
        const { data: urlData } = supabaseClient.storage.from(bucket).getPublicUrl(path);
        console.log("Upload successful:", {
            path: data.path,
            url: urlData.publicUrl,
        });
        return {
            success: true,
            url: urlData.publicUrl,
            path: data.path,
        };
    }
    catch (err) {
        console.error("File upload error:", {
            message: err.message,
            stack: err.stack,
            name: err.name,
        });
        return {
            success: false,
            error: err.message || "Failed to upload file",
        };
    }
}
/**
 * Delete a file from Supabase Storage
 */
async function deleteFile(bucket, path) {
    try {
        const supabaseClient = (0, supabase_1.getSupabase)();
        const { error } = await supabaseClient.storage.from(bucket).remove([path]);
        if (error) {
            console.error("Supabase delete error:", error);
            return false;
        }
        return true;
    }
    catch (err) {
        console.error("File delete error:", err);
        return false;
    }
}
/**
 * Get public URL for a file
 */
function getPublicUrl(bucket, path) {
    const supabaseClient = (0, supabase_1.getSupabase)();
    const { data } = supabaseClient.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
}
/**
 * Check if a file exists
 */
async function fileExists(bucket, path) {
    try {
        const supabaseClient = (0, supabase_1.getSupabase)();
        const { data, error } = await supabaseClient.storage.from(bucket).list(path.split("/").slice(0, -1).join("/"));
        if (error) {
            return false;
        }
        const fileName = path.split("/").pop();
        return data?.some((file) => file.name === fileName) || false;
    }
    catch (err) {
        return false;
    }
}
/**
 * Upload a PDF file (for certificates, job submissions, etc.)
 */
async function uploadPDF(pdfBuffer, folder, filename) {
    return uploadFile({
        bucket: folder === "certificates" ? supabase_1.STORAGE_BUCKETS.CERTIFICATES : supabase_1.STORAGE_BUCKETS.JOB_SUBMISSIONS,
        path: `${folder}/${filename}`,
        file: pdfBuffer,
        contentType: "application/pdf",
    });
}
/**
 * Upload an image file (for profile pictures, company logos, etc.)
 */
async function uploadImage(imageBuffer, folder, filename) {
    const bucket = folder === "profile-pictures" ? supabase_1.STORAGE_BUCKETS.PROFILE_PICTURES : supabase_1.STORAGE_BUCKETS.COMPANY_LOGOS;
    // Detect image type from buffer
    let contentType = "image/jpeg";
    if (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50) {
        contentType = "image/png";
    }
    else if (imageBuffer[0] === 0x47 && imageBuffer[1] === 0x49) {
        contentType = "image/gif";
    }
    else if (imageBuffer[0] === 0x57 && imageBuffer[1] === 0x45) {
        contentType = "image/webp";
    }
    return uploadFile({
        bucket,
        path: `${folder}/${filename}`,
        file: imageBuffer,
        contentType,
    });
}
/**
 * Upload a chat attachment
 */
async function uploadChatAttachment(fileBuffer, taskId, filename, contentType) {
    return uploadFile({
        bucket: supabase_1.STORAGE_BUCKETS.CHAT_ATTACHMENTS,
        path: `task-${taskId}/${filename}`,
        file: fileBuffer,
        contentType: contentType || "application/octet-stream",
    });
}
