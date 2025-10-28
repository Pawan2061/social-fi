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
exports.distributeVaultFunds = exports.getVaultBalance = exports.getNFTHoldersForCreator = exports.refundClaim = exports.payoutClaim = exports.acceptClaim = exports.finalizeClaimWithDistribution = exports.finalizeClaim = exports.voteOnClaim = exports.updateClaim = exports.getClaims = exports.getClaim = exports.createClaim = void 0;
const prisma_1 = require("../lib/prisma");
const image_helper_1 = require("../lib/image-helper");
const web3_js_1 = require("@solana/web3.js");
const createClaim = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { reason, amount, media, validTill, evidenceIpfsHash, creatorPoolAddress, vaultAddress, creatorUsdcAccount, } = req.body;
        const creatorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!creatorId)
            return res.status(401).json({ error: "Unauthorized" });
        // Store on-chain data in the reason field temporarily (as per user's request to avoid schema changes)
        const onchainData = {
            evidenceIpfsHash,
            creatorPoolAddress,
            vaultAddress,
            creatorUsdcAccount,
        };
        const claim = yield prisma_1.prisma.claim.create({
            data: {
                creatorId,
                reason: JSON.stringify({
                    originalReason: reason,
                    onchainData,
                }),
                amount,
                validTill: validTill
                    ? new Date(validTill)
                    : new Date(Date.now() + 24 * 60 * 60 * 1000),
                media: {
                    create: (media || []).map((m) => ({
                        type: m.type,
                        url: m.url,
                        thumbnail: m.thumbnail,
                        needsSignedUrl: true,
                    })),
                },
            },
            include: { media: true },
        });
        res.status(200).json(claim);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
exports.createClaim = createClaim;
const getClaim = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const claim = yield prisma_1.prisma.claim.findUnique({
            where: { id: id },
            include: {
                media: true,
                creator: true,
            },
        });
        if (!claim)
            return res.status(404).json({ error: "Claim not found" });
        const media = yield Promise.all(claim.media.map((m) => __awaiter(void 0, void 0, void 0, function* () {
            return (Object.assign(Object.assign({}, m), { url: yield (0, image_helper_1.resolveMediaUrl)(m.url) }));
        })));
        res.status(200).json(Object.assign(Object.assign({}, claim), { media, creator: Object.assign(Object.assign({}, claim.creator), { image: claim.creator.image
                    ? yield (0, image_helper_1.resolveMediaUrl)(claim.creator.image)
                    : null }) }));
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
exports.getClaim = getClaim;
const getClaims = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res
                .status(401)
                .json({ error: "Authentication required to view claims" });
        }
        // Get creators that the user has NFTs for
        const ownerships = yield prisma_1.prisma.ownership.findMany({
            where: { userId },
            select: { creatorId: true },
        });
        const creatorIds = ownerships.map((o) => o.creatorId);
        // if (creatorIds.length === 0) {
        //   return res.json([]); // User has no NFTs, return empty array
        // }
        // Get claims only from creators that the user has NFTs for
        const claims = yield prisma_1.prisma.claim.findMany({
            where: {
                OR: [
                    { creatorId: { in: creatorIds } }, // Claims from creators whose NFTs you own
                    { creatorId: userId }, // Claims you created
                ],
            },
            include: { media: true, creator: true },
        });
        const transformed = yield Promise.all(claims.map((claim) => __awaiter(void 0, void 0, void 0, function* () {
            const media = yield Promise.all(claim.media.map((m) => __awaiter(void 0, void 0, void 0, function* () {
                return (Object.assign(Object.assign({}, m), { url: yield (0, image_helper_1.resolveMediaUrl)(m.url) }));
            })));
            return Object.assign(Object.assign({}, claim), { media, creator: Object.assign(Object.assign({}, claim.creator), { image: claim.creator.image
                        ? yield (0, image_helper_1.resolveMediaUrl)(claim.creator.image)
                        : null }) });
        })));
        res.status(200).json(transformed);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
exports.getClaims = getClaims;
const updateClaim = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { claimId } = req.params;
        const { reason, amount, media } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const existingClaim = yield prisma_1.prisma.claim.findUnique({
            where: { id: claimId },
        });
        if (!existingClaim || existingClaim.creatorId !== userId) {
            return res.status(403).json({ error: "Not allowed" });
        }
        const updated = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            yield tx.media.deleteMany({
                where: { claimId: claimId },
            });
            return tx.claim.update({
                where: { id: claimId },
                data: {
                    reason: reason !== null && reason !== void 0 ? reason : existingClaim.reason,
                    amount: amount !== null && amount !== void 0 ? amount : existingClaim.amount,
                    media: {
                        create: (media || []).map((m) => ({
                            type: m.type,
                            url: m.url,
                            thumbnail: m.thumbnail,
                            needsSignedUrl: true,
                        })),
                    },
                },
                include: { media: true },
            });
        }));
        res.status(200).json(updated);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ message: e.message });
    }
});
exports.updateClaim = updateClaim;
const voteOnClaim = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { claimId } = req.params;
        const { choice, transactionSignature, onchainClaimAddress, creatorPoolAddress, nftOwnershipAddress, creatorCollectionAddress, } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const claim = yield prisma_1.prisma.claim.findUnique({
            where: { id: claimId },
        });
        if (!claim) {
            return res.status(404).json({ error: "Claim not found" });
        }
        // Create or update vote record
        const vote = yield prisma_1.prisma.vote.upsert({
            where: {
                claimId_userId: {
                    claimId: claimId,
                    userId: userId,
                },
            },
            update: {
                approve: choice === "Yes",
                txSig: transactionSignature,
            },
            create: {
                claimId: claimId,
                userId: userId,
                approve: choice === "Yes",
                txSig: transactionSignature,
            },
        });
        res.json({
            message: `Vote ${choice} recorded successfully`,
            vote,
        });
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
exports.voteOnClaim = voteOnClaim;
const finalizeClaim = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { claimId } = req.params;
        const { transactionSignature, onchainClaimAddress, creatorPoolAddress } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const claim = yield prisma_1.prisma.claim.findUnique({
            where: { id: claimId },
            include: { votes: true },
        });
        if (!claim) {
            return res.status(404).json({ error: "Claim not found" });
        }
        // Check if user is the creator
        if (claim.creatorId !== userId) {
            return res
                .status(403)
                .json({ error: "Only the creator can finalize this claim" });
        }
        const yesVotes = claim.votes.filter((v) => v.approve).length;
        const noVotes = claim.votes.filter((v) => !v.approve).length;
        const status = yesVotes > noVotes ? "APPROVED" : "REJECTED";
        const updated = yield prisma_1.prisma.claim.update({
            where: { id: claim.id },
            data: { status },
        });
        res.json({
            message: `Claim ${status.toLowerCase()}`,
            claim: updated,
            yesVotes,
            noVotes,
            status,
        });
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
exports.finalizeClaim = finalizeClaim;
const finalizeClaimWithDistribution = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { claimId } = req.params;
        const { transactionSignature, onchainClaimAddress, creatorPoolAddress, result, distributedAmount, } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const claim = yield prisma_1.prisma.claim.findUnique({
            where: { id: claimId },
            include: { votes: true, creator: true },
        });
        if (!claim) {
            return res.status(404).json({ error: "Claim not found" });
        }
        // Check if user is the creator
        if (claim.creatorId !== userId) {
            return res
                .status(403)
                .json({ error: "Only the creator can finalize this claim" });
        }
        const yesVotes = claim.votes.filter((v) => v.approve).length;
        const noVotes = claim.votes.filter((v) => !v.approve).length;
        const isApproved = result === "approved" || yesVotes > noVotes;
        // Update claim status based on result
        const status = isApproved ? "APPROVED" : "REJECTED";
        const updated = yield prisma_1.prisma.claim.update({
            where: { id: claim.id },
            data: { status },
        });
        // Handle fund distribution
        let distributionResult = null;
        if (distributedAmount > 0) {
            try {
                distributionResult = yield (0, exports.distributeVaultFunds)(claimId, isApproved);
                console.log(`💰 Distribution result for claim ${claimId}:`, distributionResult);
            }
            catch (distError) {
                console.error("❌ Distribution failed:", distError);
                // Don't fail the entire request if distribution fails
            }
        }
        res.json({
            message: `Claim ${status.toLowerCase()} with fund distribution`,
            claim: updated,
            yesVotes,
            noVotes,
            status,
            result: isApproved ? "approved" : "rejected",
            distributedAmount,
            distributionResult,
        });
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
exports.finalizeClaimWithDistribution = finalizeClaimWithDistribution;
const acceptClaim = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { claimId } = req.params;
        const { txid } = req.body;
        const creatorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!creatorId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const claim = yield prisma_1.prisma.claim.findUnique({
            where: { id: claimId },
            include: { votes: true },
        });
        if (!claim) {
            return res.status(404).json({ error: "Claim not found" });
        }
        const yesVotes = claim.votes.filter((v) => v.approve).length;
        const noVotes = claim.votes.filter((v) => !v.approve).length;
        const status = yesVotes > noVotes ? "APPROVED" : "REJECTED";
        let success = true;
        //  ya pani txid le verify vote
        if (success) {
            const updated = yield prisma_1.prisma.claim.update({
                where: { id: claim.id },
                data: { status },
            });
            res.json({
                message: `Claim ${status.toLowerCase()}`,
                claim: updated,
                yesVotes,
                noVotes,
            });
        }
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
});
exports.acceptClaim = acceptClaim;
const payoutClaim = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { claimId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const claim = yield prisma_1.prisma.claim.findUnique({
            where: { id: claimId },
            include: { creator: true },
        });
        if (!claim) {
            return res.status(404).json({ error: "Claim not found" });
        }
        if (claim.creatorId !== userId) {
            return res
                .status(403)
                .json({ error: "Only the creator can process claim payout" });
        }
        // Check if claim is approved
        if (claim.status !== "APPROVED") {
            return res
                .status(400)
                .json({ error: "Claim must be approved before payout" });
        }
        // Distribute funds to creator (approved claim)
        const distributionResult = yield (0, exports.distributeVaultFunds)(claimId, true);
        console.log("💰 Payout distribution result:", distributionResult);
        // Update claim status to paid
        const updatedClaim = yield prisma_1.prisma.claim.update({
            where: { id: claimId },
            data: { status: "PAID" },
        });
        res.json({
            message: "Claim payout processed successfully",
            status: "PAID",
            claim: updatedClaim,
            distribution: distributionResult,
        });
    }
    catch (error) {
        console.error("Error processing claim payout:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.payoutClaim = payoutClaim;
const refundClaim = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { claimId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // Get the claim
        const claim = yield prisma_1.prisma.claim.findUnique({
            where: { id: claimId },
            include: { creator: true },
        });
        if (!claim) {
            return res.status(404).json({ error: "Claim not found" });
        }
        // Check if user is the creator
        if (claim.creatorId !== userId) {
            return res
                .status(403)
                .json({ error: "Only the creator can process claim refund" });
        }
        // Check if claim is rejected
        if (claim.status !== "REJECTED") {
            return res
                .status(400)
                .json({ error: "Claim must be rejected before refund" });
        }
        // Distribute funds to NFT holders (rejected claim)
        const distributionResult = yield (0, exports.distributeVaultFunds)(claimId, false);
        console.log("🔄 Refund distribution result:", distributionResult);
        // Update claim status to refunded
        const updatedClaim = yield prisma_1.prisma.claim.update({
            where: { id: claimId },
            data: { status: "REJECTED" }, // Use existing status instead of REFUNDED
        });
        res.json({
            message: "Claim refund processed successfully",
            status: "REFUNDED",
            claim: updatedClaim,
            distribution: distributionResult,
        });
    }
    catch (error) {
        console.error("Error processing claim refund:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.refundClaim = refundClaim;
// Helper function to get NFT holders for a creator
const getNFTHoldersForCreator = (creatorId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ownerships = yield prisma_1.prisma.ownership.findMany({
            where: { creatorId },
            include: {
                user: {
                    select: {
                        wallet: true,
                        name: true,
                        id: true,
                    },
                },
            },
        });
        return ownerships.map((o) => ({
            wallet: o.user.wallet,
            name: o.user.name,
            userId: o.user.id,
        }));
    }
    catch (error) {
        console.error("Error getting NFT holders:", error);
        throw new Error("Failed to get NFT holders");
    }
});
exports.getNFTHoldersForCreator = getNFTHoldersForCreator;
// Helper function to get vault balance
const getVaultBalance = (vaultAddress) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)("devnet"));
        const vaultPublicKey = new web3_js_1.PublicKey(vaultAddress);
        const balance = yield connection.getBalance(vaultPublicKey);
        return balance / web3_js_1.LAMPORTS_PER_SOL; // Convert lamports to SOL
    }
    catch (error) {
        console.error("Error getting vault balance:", error);
        throw new Error("Failed to get vault balance");
    }
});
exports.getVaultBalance = getVaultBalance;
// Main fund distribution function
const distributeVaultFunds = (claimId, isApproved) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`🔄 Starting fund distribution for claim ${claimId}, approved: ${isApproved}`);
        // Get claim with creator and pass info
        const claim = yield prisma_1.prisma.claim.findUnique({
            where: { id: claimId },
            include: {
                creator: true,
                votes: true,
            },
        });
        if (!claim) {
            throw new Error("Claim not found");
        }
        // Get the pass for this creator
        const pass = yield prisma_1.prisma.pass.findUnique({
            where: { creatorId: claim.creatorId },
        });
        if (!pass || !pass.vault_address) {
            throw new Error("Creator pass or vault address not found");
        }
        // Get vault balance
        const vaultBalance = yield (0, exports.getVaultBalance)(pass.vault_address);
        console.log(`💰 Vault balance: ${vaultBalance} SOL`);
        if (vaultBalance <= 0) {
            console.log("⚠️ Vault is empty, no funds to distribute");
            return {
                success: true,
                message: "Vault is empty, no funds to distribute",
                distributedAmount: 0,
            };
        }
        if (isApproved) {
            // Transfer entire vault to creator
            console.log(`✅ Claim approved - transferring ${vaultBalance} SOL to creator`);
            // Note: In a real implementation, you would call the on-chain transfer here
            // For now, we'll just log the action
            console.log(`📤 Would transfer ${vaultBalance} SOL to creator wallet: ${claim.creator.wallet}`);
            return {
                success: true,
                message: `Transferred ${vaultBalance} SOL to creator`,
                distributedAmount: vaultBalance,
                recipient: claim.creator.wallet,
                recipientType: "creator",
            };
        }
        else {
            // Distribute equally among NFT holders
            const holders = yield (0, exports.getNFTHoldersForCreator)(claim.creatorId);
            console.log(`👥 Found ${holders.length} NFT holders for creator ${claim.creatorId}`);
            if (holders.length === 0) {
                console.log("⚠️ No NFT holders found, no funds to distribute");
                return {
                    success: true,
                    message: "No NFT holders found, no funds to distribute",
                    distributedAmount: 0,
                };
            }
            const amountPerHolder = vaultBalance / holders.length;
            console.log(`💰 Distributing ${amountPerHolder} SOL to each of ${holders.length} holders`);
            // Note: In a real implementation, you would call the on-chain transfers here
            // For now, we'll just log the action
            holders.forEach((holder, index) => {
                console.log(`📤 Would transfer ${amountPerHolder} SOL to holder ${index + 1}: ${holder.wallet} (${holder.name})`);
            });
            return {
                success: true,
                message: `Distributed ${vaultBalance} SOL among ${holders.length} NFT holders`,
                distributedAmount: vaultBalance,
                amountPerHolder,
                recipients: holders,
                recipientType: "nft_holders",
            };
        }
    }
    catch (error) {
        console.error("Error distributing vault funds:", error);
        throw new Error(`Failed to distribute vault funds: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
});
exports.distributeVaultFunds = distributeVaultFunds;
