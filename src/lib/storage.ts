import { supabase } from './supabase';

/**
 * Uploads a file to the 'documents' bucket in Supabase Storage.
 * Organized by user_id/request_id/filename
 */
export async function uploadTravelDocument(
    userId: string,
    requestId: string,
    file: File,
    type: 'comprovante' | 'bilhete' | 'relatorio' | 'prestacao_contas'
) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${userId}/${requestId}/${fileName}`;

    // 1. Upload to Storage
    const { error: uploadError, data } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

    if (uploadError) {
        throw uploadError;
    }

    // 2. Register in Database
    const { error: dbError } = await supabase
        .from('travel_documents')
        .insert({
            travel_id: requestId,
            uploaded_by: userId,
            tipo: type,
            storage_path: data.path
        });

    if (dbError) {
        // Cleanup storage on DB failure
        await supabase.storage.from('documents').remove([filePath]);
        throw dbError;
    }

    return data.path;
}

/**
 * Gets a signed URL for viewing a document
 */
export async function getDocumentUrl(path: string) {
    const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(path, 3600); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
}
