"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateData = validateData;
const zod_1 = require("zod");
const http_status_codes_1 = require("http-status-codes");
function validateData(schema) {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errorMessages = error.issues.map((issue) => ({
                    path: issue.path.join("."),
                    message: issue.message,
                }));
                return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                    error: "Invalid data",
                    details: errorMessages,
                });
            }
            return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                error: "Internal Server Error",
            });
        }
    };
}
