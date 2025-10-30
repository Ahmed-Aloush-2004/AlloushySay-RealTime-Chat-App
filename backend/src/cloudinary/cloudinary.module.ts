import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { CloudinaryController } from './cloudinary.controller';

@Module({
    imports:[],
    controllers:[CloudinaryController],
    providers: [CloudinaryService],
    exports: [CloudinaryService],
})
export class CloudinaryModule {
    
}
