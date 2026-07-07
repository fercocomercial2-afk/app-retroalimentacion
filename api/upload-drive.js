import { google } from 'googleapis';
import { Readable } from 'stream';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '150mb',
    },
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { fileName, fileData, mimeType } = req.body;
    if (!fileName || !fileData) return res.status(400).json({ error: 'fileName and fileData are required' });

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GDRIVE_CLIENT_EMAIL,
        private_key: process.env.GDRIVE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    const buffer = Buffer.from(fileData, 'base64');
    const stream = Readable.from(buffer);

    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [process.env.GDRIVE_FOLDER_ID],
      },
      media: {
        mimeType: mimeType || 'application/pdf',
        body: stream,
      },
      fields: 'id,webViewLink',
    });

    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: { role: 'reader', type: 'anyone' },
    });

    const file = await drive.files.get({
      fileId: response.data.id,
      fields: 'webViewLink',
    });

    return res.status(200).json({ success: true, url: file.data.webViewLink });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: error.message });
  }
}