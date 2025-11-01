import { Injectable, InternalServerErrorException, Logger, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import toStream = require('buffer-to-stream');
import { ConfigService } from '@nestjs/config';

// Interface defining the essential data the service must return to the controller
export interface CloudinaryUploadResult {
    secure_url: string;
    public_id: string;
    resource_type: string;
    format: string;
    bytes: number;
    created_at: string;
}

@Injectable()
export class CloudinaryService {
    private readonly logger = new Logger(CloudinaryService.name);
    private readonly allowedFileTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'video/mp4',
        'video/avi',
        'video/mov',
        'video/wmv',
        'video/flv',
        'video/webm',
        'video/mpeg',
        'audio/webm',
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
        'audio/mp3',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/zip',
        'application/x-rar-compressed',
    ];

    private readonly maxFileSize = 100 * 1024 * 1024; // 100MB

    constructor(
        private readonly configService: ConfigService,
    ) {
        // Configure Cloudinary using the NestJS ConfigService
        cloudinary.config({
            cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
            api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
            api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
        });
        this.logger.log('Cloudinary configuration loaded successfully.');
    }

    /**
     * Validates file type and size before upload
     */
    private validateFile(file: Express.Multer.File): void {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        if (file.size > this.maxFileSize) {
            throw new BadRequestException(`File size exceeds the maximum limit of ${this.maxFileSize / (1024 * 1024)}MB`);
        }

        console.error('this is the file : ', file);


        if (!this.allowedFileTypes.includes(file.mimetype)) {
            throw new BadRequestException(`File type ${file.mimetype} is not supported`);
        }
    }

    /**
     * Determines the resource type based on MIME type
     */
    private getResourceType(mimetype: string): string {
        if (mimetype.startsWith('image/')) {
            return 'image';
        } else if (mimetype.startsWith('video/')) {
            return 'video';
        } else if (mimetype.startsWith('audio/')) {
            return 'video'; // Cloudinary uses 'video' for both video and audio
        } else {
            return 'raw'; // For documents and other file types
        }
    }

    /**
     * Gets appropriate upload options based on file type
     */
    private getUploadOptions(mimetype: string): any {
        const resourceType = this.getResourceType(mimetype);
        const baseOptions = {
            folder: 'chat-files-app',
            resource_type: resourceType,
            use_filename: true,
            unique_filename: true,
        };

        // Add specific options based on file type
        if (mimetype.startsWith('image/')) {
            return {
                ...baseOptions,
                quality: 'auto:good',
                fetch_format: 'auto',
            };
        } else if (mimetype.startsWith('video/')) {
            return {
                ...baseOptions,
                quality: 'auto',
                chunk_size: 6000000, // 6MB chunks for large videos
            };
        } else if (mimetype.startsWith('audio/')) {
            return {
                ...baseOptions,
                resource_type: 'video', // Cloudinary uses 'video' for audio
                audio_codec: 'aac',
            };
        } else {
            return baseOptions;
        }
    }

    /**
     * Uploads a file buffer (from Multer) to Cloudinary using a stream.
     * The return type is strictly defined by CloudinaryUploadResult.
     */
    async uploadFile(file: Express.Multer.File): Promise<CloudinaryUploadResult> {
        this.logger.debug(`Starting upload for: ${file.originalname}`);

        // Validate file before upload
        this.validateFile(file);

        return new Promise((resolve, reject) => {
            const uploadOptions = this.getUploadOptions(file.mimetype);

            const uploadStream = cloudinary.uploader.upload_stream(
                uploadOptions,
                (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
                    if (error) {
                        this.logger.error('Cloudinary upload error:', error.message);
                        return reject(new InternalServerErrorException('Cloudinary upload failed.'));
                    }
                    if (!result) {
                        return reject(new InternalServerErrorException('Cloudinary upload returned no result.'));
                    }

                    // Resolve with all necessary information
                    resolve({
                        secure_url: result.secure_url,
                        public_id: result.public_id,
                        resource_type: result.resource_type,
                        format: result.format,
                        bytes: result.bytes,
                        created_at: result.created_at,
                    });
                },
            );

            // Pipe the file buffer into the Cloudinary upload stream
            toStream(file.buffer).pipe(uploadStream);
        });
    }

    /**
     * Deletes a resource from Cloudinary using its public ID and resource type.
     */
    async deleteFile(publicId: string, resourceType: string = 'auto'): Promise<void> {
        this.logger.debug(`Attempting to delete file with public_id: ${publicId}`);

        return new Promise((resolve, reject) => {
            cloudinary.uploader.destroy(
                publicId,
                { resource_type: resourceType },
                (error, result) => {
                    if (error) {
                        this.logger.error('Cloudinary delete error:', error.message);
                        return reject(new InternalServerErrorException('Cloudinary deletion failed.'));
                    }

                    // Check if the deletion was successful
                    if (result.result !== 'ok') {
                        // If result is 'not found', we can still resolve as the goal (file absence) is met.
                        if (result.result === 'not found') {
                            this.logger.warn(`File public_id: ${publicId} was not found, resolving anyway.`);
                            return resolve();
                        }
                        this.logger.error(`File deletion failed with status: ${result.result}`);
                        return reject(new InternalServerErrorException(`File deletion failed: ${result.result}`));
                    }

                    this.logger.log(`File with public_id: ${publicId} deleted successfully.`);
                    resolve();
                }
            );
        });
    }
}