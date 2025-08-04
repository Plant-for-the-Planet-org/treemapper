import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  fileName: string;
  expiresIn: number;
}

export interface GeneratePresignedUrlDto {
  fileName: string;
  fileType: string;
  folder?: string; // Optional folder path
}

@Injectable()
export class R2Service {
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor(private configService: ConfigService) {
    // Initialize S3 client with R2 configuration
    const endpoint = this.configService.get<string>('R2_ENDPOINT');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    const bucketName = this.configService.get<string>('R2_BUCKET_NAME');
    const publicUrl = this.configService.get<string>('R2_PUBLIC_URL');

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
      throw new Error('Missing required R2 configuration environment variables');
    }

    this.s3Client = new S3Client({
      region: 'auto', // Cloudflare R2 uses 'auto' region
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      // Force path-style URLs for R2 compatibility
      forcePathStyle: true,
    });

    this.bucketName = bucketName;
    this.publicUrl = publicUrl;
  }

  async generatePresignedUrl(
    dto: GeneratePresignedUrlDto,
  ): Promise<PresignedUrlResponse> {
    try {
      // Generate unique filename to prevent conflicts
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const fileExtension = dto.fileName.split('.').pop();
      const uniqueFileName = `${timestamp}-${randomString}.${fileExtension}`;
      
      // Construct full key path (with optional folder)
      const key = dto.folder 
        ? `${dto.folder}/${uniqueFileName}` 
        : uniqueFileName;

      // Create the PutObject command
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: dto.fileType,
        // Optional: Add metadata
        Metadata: {
          'original-name': dto.fileName,
          'upload-timestamp': timestamp.toString(),
        },
      });

      // Generate presigned URL (expires in 5 minutes)
      const expiresIn = 600; // 5 minutes
      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      // Construct the final public URL
      const fileUrl = `${this.publicUrl}/${key}`;

      return {
        uploadUrl,
        fileUrl,
        fileName: uniqueFileName,
        expiresIn,
      };
    } catch (error) {
      throw new Error(`Failed to generate presigned URL: ${error.message}`);
    }
  }

  // Optional: Generate presigned URL for getting/downloading files
  async generatePresignedGetUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  // Optional: Validate file type
  private validateFileType(fileType: string, allowedTypes: string[]): boolean {
    return allowedTypes.some(type => fileType.startsWith(type));
  }
}