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

exports.handler = async (event, context) => {
  // CORS Headers (Allows your site to talk to this backend)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle "Pre-flight" check
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { action, file_key, file_type } = JSON.parse(event.body);
    const BUCKET_NAME = process.env.R2_BUCKET_NAME;

    if (!file_key) throw new Error("Missing file_key");

    let url;
    if (action === 'upload') {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: file_key,
        ContentType: file_type,
      });
      url = await getSignedUrl(R2, command, { expiresIn: 600 });
    } else if (action === 'download') {
        // We will use this later for downloading
       const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: file_key,
      });
      url = await getSignedUrl(R2, command, { expiresIn: 3600 });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
