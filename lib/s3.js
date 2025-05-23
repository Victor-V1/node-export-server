import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-west-2'
});

/**
 * Uploads a base64 encoded image to S3 and returns the CDN URL
 * @param {string} base64Image - The base64 encoded image
 * @param {string} fileType - The file type (e.g., 'png', 'jpeg')
 * @returns {Promise<string>} The CDN URL of the uploaded image
 */
export const uploadToS3 = async (base64Image, fileType) => {
  const BUCKET_NAME = process.env.S3_BUCKET_NAME;
  const CDN_DOMAIN = process.env.CDN_DOMAIN;

  if (!BUCKET_NAME) {
    throw new Error('S3_BUCKET_NAME environment variable is required');
  }
  // Convert base64 to buffer
  const buffer = Buffer.from(base64Image, 'base64');

  // Generate a unique filename
  const filename = `${randomUUID()}.${fileType}`;

  // Upload to S3
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: filename,
    Body: buffer,
    ContentType: `image/${fileType}`,
    CacheControl: 'public, max-age=31536000' // Cache for 1 year
  });

  await s3Client.send(command);

  // Return CDN URL if CDN_DOMAIN is configured, otherwise generate a signed URL
  if (CDN_DOMAIN) {
    return `https://${CDN_DOMAIN}/${filename}`;
  } else {
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filename
    });
    return await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 }); // URL valid for 1 hour
  }
};
