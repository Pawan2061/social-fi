"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUBLIC_BUCKET_URL = void 0;
exports.getSignedUploadUrl = getSignedUploadUrl;
exports.getSignedUrlForMedia = getSignedUrlForMedia;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const cloudfront_signer_1 = require("@aws-sdk/cloudfront-signer");
exports.PUBLIC_BUCKET_URL = process.env.CLOUDFRONT_URL;
const s3 = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
const BUCKET = process.env.AWS_S3_BUCKET;
function getSignedUploadUrl(fileName, fileType) {
    return __awaiter(this, void 0, void 0, function* () {
        const key = `uploads/${Date.now()}-${fileName}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            ContentType: fileType,
        });
        const uploadUrl = yield (0, s3_request_presigner_1.getSignedUrl)(s3, command, { expiresIn: 300 });
        return { uploadUrl, key };
    });
}
function getSignedUrlForMedia(key) {
    const url = `${process.env.CLOUDFRONT_URL}/${key}`;
    const privateKey = process.env.CLOUDFRONT_PRIVATE_KEY.replace(/\\n/g, "\n");
    return (0, cloudfront_signer_1.getSignedUrl)({
        url,
        keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
        privateKey,
        dateLessThan: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiry
    });
}
