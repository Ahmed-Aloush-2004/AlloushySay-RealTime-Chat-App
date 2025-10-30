export interface FileUploadResponse {
    url: string;
    fileType: string;
    originalName: string;
    publicId: string; // The service needs to return this for future deletion!
}