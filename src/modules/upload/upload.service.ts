import configuration from '@/configs/configuration';
import { getFileName } from '@/utils/helper';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';

const S3_REGION = 'ap-southeast-1';
const DEFAULT_BUCKET = 'shopee-fake-bucket';

@Injectable()
export class UploadService {
  private s3: S3Client;
  private logger: Logger;
  constructor() {
    const config = configuration();
    this.s3 = new S3Client({
      region: S3_REGION,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    });
    this.logger = new Logger(UploadService.name);
  }

  async uploadFile(file: Express.Multer.File, bucket = DEFAULT_BUCKET) {
    try {
      const name = getFileName(file.originalname);
      await this.s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: name,
          Body: file.buffer,
        }),
      );

      this.logger.log(`Upload file :: ${name}`);

      return {
        url: `https://${bucket}.s3.${S3_REGION}.amazonaws.com/${name}`,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
}
