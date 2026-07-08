import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { fileName, mimeType, fileSize } = req.body;
    if (!fileName) return res.status(400).json({ error: 'fileName is required' });

    const s3 = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });

    const key = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    // Generar URL pre-firmada para que el navegador suba directo a R2
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: mimeType || 'application/pdf',
    });

    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min

    // URL pública final del archivo
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    return res.status(200).json({ presignedUrl, publicUrl, key });
  } catch (error) {
    console.error('Presign error:', error);
    return res.status(500).json({ error: error.message });
  }
}