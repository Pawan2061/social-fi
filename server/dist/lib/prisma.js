"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const prisma_1 = require("../generated/prisma"); // or "@prisma/client" if default output
// Ensure only 1 instance is created (fixes hot-reload issue in dev)
const globalForPrisma = global;
exports.prisma = (_a = globalForPrisma.prisma) !== null && _a !== void 0 ? _a : new prisma_1.PrismaClient({
    log: ["error", "warn"], // optional, good for debugging
});
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = exports.prisma;
}
