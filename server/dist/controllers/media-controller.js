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
exports.updateMediaUrl = void 0;
const prisma_1 = require("../lib/prisma");
const updateMediaUrl = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { originalKey, playlistPath } = req.body;
        console.log(originalKey);
        console.log(playlistPath);
        console.log(yield prisma_1.prisma.media.findMany({
            where: {
                url: originalKey,
            },
        }));
        if (!originalKey || !playlistPath) {
            return res
                .status(400)
                .json({ error: "Missing originalKey or playlistPath" });
        }
        const result = yield prisma_1.prisma.media.updateMany({
            where: { url: originalKey },
            data: { url: playlistPath },
        });
        if (result.count === 0) {
            return res
                .status(404)
                .json({ message: "No media found with the given URL" });
        }
        return res.status(200).json({
            message: "Media URL updated successfully",
            updatedCount: result.count,
        });
    }
    catch (error) {
        console.error("Error updating media URL:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
exports.updateMediaUrl = updateMediaUrl;
