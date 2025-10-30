// import { Body, Controller, Delete, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
// import { CloudinaryService } from "./cloudinary.service";
// import { FileInterceptor } from "@nestjs/platform-express";





// @Controller('files')
// export class CloudinaryController {
//     constructor(
//         private readonly cloudinaryService: CloudinaryService
//     ) { }

//     @Post('upload')
//     @UseInterceptors(FileInterceptor('file')) // 'file' is the key expected in the FormData
//     async uploadFile(@UploadedFile() file: Express.Multer.File) {
//         // 1. Upload file to Cloudinary
//         const uploadResult = await this.cloudinaryService.uploadFile(file);

//         // 2. Return the secure URL and other info
//         return {
//             url: uploadResult.secure_url,
//             fileType: uploadResult.resource_type,
//             originalName: file.originalname,
//             publicId: uploadResult.public_id, // <--- ADD THIS
//         };
//     }

//     @Delete('remove-file')
//     async deleteFile(@Body('public_id') publicId: string) {
//         try {
//             await this.cloudinaryService.deleteFile(publicId);
//             return { message: 'File deleted successfully.' };
//         } catch (error) {
//             console.error(error);
//             throw new Error('Failed to delete file.');
//         }
//     }

// }



// cloudinary.controller.ts
import { Controller, Post, Delete, UseInterceptors, UploadedFile, Body, BadRequestException, Logger, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService, CloudinaryUploadResult } from './cloudinary.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('files')
export class CloudinaryController {
    private readonly logger = new Logger(CloudinaryController.name);

    constructor(
        private readonly cloudinaryService: CloudinaryService
    ) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file')) // 'file' is the key expected in the FormData
    @UseGuards(JwtAuthGuard)
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        try {
            // 1. Upload file to Cloudinary
            const uploadResult: CloudinaryUploadResult = await this.cloudinaryService.uploadFile(file);

            // 2. Return the secure URL and other info
            return {
                url: uploadResult.secure_url,
                fileType: uploadResult.resource_type,
                format: uploadResult.format,
                originalName: file.originalname,
                size: uploadResult.bytes,
                publicId: uploadResult.public_id,
                createdAt: uploadResult.created_at,
            };
        } catch (error) {
            this.logger.error(`File upload failed: ${error.message}`);
            throw error;
        }
    }

    @Delete('remove-file')
    @UseGuards(JwtAuthGuard)
    async deleteFile(@Body('public_id') publicId: string, @Body('resource_type') resourceType?: string) {
        try {
            if (!publicId) {
                throw new BadRequestException('Public ID is required');
            }
            
            await this.cloudinaryService.deleteFile(publicId, resourceType);
            return { message: 'File deleted successfully.' };
        } catch (error) {
            this.logger.error(`File deletion failed: ${error.message}`);
            throw error;
        }
    }
}