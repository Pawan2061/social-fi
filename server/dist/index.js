"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_route_1 = __importDefault(require("./routes/auth-route"));
const cors_1 = __importDefault(require("cors"));
const post_routes_1 = __importDefault(require("./routes/post-routes"));
const pass_route_1 = __importDefault(require("./routes/pass-route"));
const claim_routes_1 = __importDefault(require("./routes/claim-routes"));
const vote_route_1 = __importDefault(require("./routes/vote-route"));
const user_route_1 = __importDefault(require("./routes/user-route"));
const media_route_1 = __importDefault(require("./routes/media-route"));
const widget_route_1 = __importDefault(require("./routes/widget-route"));
const metadata_route_1 = __importDefault(require("./routes/metadata-route"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: "http://localhost:3000",
    credentials: true,
}));
app.use(express_1.default.json());
const apiRouter = express_1.default.Router();
const JWT_SECRET = process.env.JWT_SECRET;
apiRouter.use("/auth", auth_route_1.default);
apiRouter.use("/posts", post_routes_1.default);
apiRouter.use("/pass", pass_route_1.default);
apiRouter.use("/claim", claim_routes_1.default);
apiRouter.use("/votes", vote_route_1.default);
apiRouter.use("/users", user_route_1.default);
apiRouter.use("/media", media_route_1.default);
apiRouter.use("/widgets", widget_route_1.default);
apiRouter.use("/metadata", metadata_route_1.default);
app.use("/api", apiRouter);
//  For testting purpose aaile , see  chaiyeko user id from prisma studio
app.get("/api/jwt", (req, res) => {
    const token = jsonwebtoken_1.default.sign({ userId: req.body.id }, JWT_SECRET, {
        expiresIn: "7d",
    });
    res.json({ token });
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`✅ Server listening on http://localhost:${PORT}`);
});
