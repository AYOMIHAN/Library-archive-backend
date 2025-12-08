// This runs on Vercel
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const R2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

export default async function handler(req, res) {
  // Allow the website to talk to this backend (CORS)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { action, file_key, file_type } = req.body;
    const BUCKET_NAME = process.env.R2_BUCKET_NAME; // We will set this in Vercel

    if (!file_key) throw new Error("Missing file_key");

    let url;
    if (action === 'upload') {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: file_key,
        ContentType: file_type,
      });
      url = await getSignedUrl(R2, command, { expiresIn: 600 }); // 10 mins
    } else if (action === 'download') {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: file_key,
      });
      url = await getSignedUrl(R2, command, { expiresIn: 3600 }); // 1 hour
    }

    res.status(200).json({ url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
