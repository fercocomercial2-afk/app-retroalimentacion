const { google } = require('googleapis');

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { fileName, fileData, mimeType } = req.body;
    if (!fileName || !fileData) return res.status(400).json({ error: 'fileName and fileData are required' });

    // Autenticar con la cuenta de servicio
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GDRIVE_CLIENT_EMAIL,
        private_key: process.env.GDRIVE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Convertir base64 a buffer
    const buffer = Buffer.from(fileData, 'base64');

    // Subir archivo a Google Drive
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [process.env.GDRIVE_FOLDER_ID],
      },
      media: {
        mimeType: mimeType || 'application/pdf',
        body: require('stream').Readable.from(buffer),
      },
      fields: 'id, webViewLink',
    });

    // Hacer el archivo accesible por link
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Obtener link actualizado
    const file = await drive.files.get({
      fileId: response.data.id,
      fields: 'webViewLink',
    });

    return res.status(200).json({
      success: true,
      fileId: response.data.id,
      url: file.data.webViewLink,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: error.message });
  }
}
