"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveMediaUrl = void 0;
const storage_1 = require("./storage");
const resolveMediaUrl = (url) => {
    if (!url)
        return null;
    const lower = url.toLowerCase();
    const allowedPrefixes = [
        "https://unsplash.com",
        "https://images.unsplash.com",
        "https://cdn.jsdelivr.net",
        "https://avatars.githubusercontent.com",
        // IPFS URLs
        "https://ipfs.io/ipfs/",
        "https://gateway.pinata.cloud/ipfs/",
        "https://cloudflare-ipfs.com/ipfs/",
        "https://dweb.link/ipfs/",
        "ipfs://",
    ];
    if (allowedPrefixes.some((prefix) => lower.startsWith(prefix))) {
        return url;
    }
    return `${storage_1.PUBLIC_BUCKET_URL}/${url}`;
};
exports.resolveMediaUrl = resolveMediaUrl;
