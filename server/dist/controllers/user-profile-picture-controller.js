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
exports.signProfilePictureUpload = void 0;
const storage_1 = require("../lib/storage");
const signProfilePictureUpload = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fileName, fileType } = req.body;
        const { uploadUrl, key } = yield (0, storage_1.getSignedUploadUrl)(fileName, fileType);
        res.json({ uploadUrl, key });
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
exports.signProfilePictureUpload = signProfilePictureUpload;
