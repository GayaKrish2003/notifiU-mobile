const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const r2 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId:     process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const buildPublicUrl = (key) =>
    `${process.env.R2_PUBLIC_URL.replace(/\/+$/, '')}/${key}`;

const uploadBufferToR2 = async ({ key, buffer, contentType }) => {
    await r2.send(new PutObjectCommand({
        Bucket:      process.env.R2_BUCKET_NAME,
        Key:         key,
        Body:        buffer,
        ContentType: contentType,
    }));
    return buildPublicUrl(key);
};

const deleteObjectFromR2 = async (key) => {
    await r2.send(new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key:    key,
    }));
};

module.exports = { uploadBufferToR2, deleteObjectFromR2 };