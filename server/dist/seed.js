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
const faker_1 = require("@faker-js/faker");
const prisma_1 = require("./lib/prisma");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("🌱 Seeding Users, Passes, Ownerships, Posts, Media & Widgets...");
        const users = yield Promise.all(Array.from({ length: 25 }).map(() => prisma_1.prisma.user.create({
            data: {
                name: faker_1.faker.person.fullName(),
                email: faker_1.faker.internet.email(),
                emailVerified: faker_1.faker.datatype.boolean(),
                image: faker_1.faker.image.avatar(),
                wallet: faker_1.faker.finance.ethereumAddress(),
                nonce: faker_1.faker.string.alphanumeric(8),
                onboarded: faker_1.faker.datatype.boolean(),
            },
        })));
        console.log(`👤 Created ${users.length} users.`);
        const premiumCreators = users.slice(0, 10);
        const passes = yield Promise.all(premiumCreators.map((creator) => prisma_1.prisma.pass.create({
            data: {
                creatorId: creator.id,
                tokenMint: faker_1.faker.string.alphanumeric(32),
                vault_address: faker_1.faker.finance.ethereumAddress(),
                price: faker_1.faker.number.float({ min: 5, max: 50 }),
            },
        })));
        console.log(`💳 Created ${passes.length} passes.`);
        for (const user of users) {
            const ownedPasses = faker_1.faker.helpers.arrayElements(passes, faker_1.faker.number.int({ min: 0, max: 3 }));
            for (const pass of ownedPasses) {
                if (pass.creatorId === user.id)
                    continue;
                yield prisma_1.prisma.ownership.create({
                    data: {
                        userId: user.id,
                        passId: pass.id,
                        creatorId: pass.creatorId,
                    },
                });
            }
        }
        console.log("🪪 Ownerships assigned.");
        const posts = yield Promise.all(Array.from({ length: 40 }).map(() => prisma_1.prisma.post.create({
            data: {
                creatorId: faker_1.faker.helpers.arrayElement(users).id,
                caption: faker_1.faker.lorem.sentence(),
                isPremium: faker_1.faker.datatype.boolean(),
            },
        })));
        console.log(`📝 Created ${posts.length} posts.`);
        const unsplashImages = [
            "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
            "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e",
            "https://images.unsplash.com/photo-1517841905240-472988babdf9",
            "https://images.unsplash.com/photo-1517423440428-a5a00ad493e8",
            "https://images.unsplash.com/photo-1552058544-f2b08422138a",
            "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
            "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df",
            "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e",
            "https://images.unsplash.com/photo-1514516870926-205bb9a7a5c4",
        ];
        for (const post of posts) {
            const count = faker_1.faker.number.int({ min: 1, max: 3 });
            for (let i = 0; i < count; i++) {
                const imageUrl = faker_1.faker.helpers.arrayElement(unsplashImages);
                yield prisma_1.prisma.media.create({
                    data: {
                        postId: post.id,
                        type: "image",
                        url: imageUrl,
                        thumbnail: imageUrl + "?w=200&h=200&fit=crop",
                        needsSignedUrl: false,
                    },
                });
            }
        }
        console.log("⚙️ Creating Widgets for Premium Creators...");
        for (const creator of premiumCreators) {
            const widgetType = faker_1.faker.helpers.arrayElement(["GOAL", "POLL"]);
            if (widgetType === "GOAL") {
                yield prisma_1.prisma.widget.create({
                    data: {
                        creatorId: creator.id,
                        type: "GOAL",
                        title: faker_1.faker.company.catchPhrase(),
                        description: faker_1.faker.lorem.sentence(),
                        targetValue: faker_1.faker.number.int({ min: 5, max: 100 }),
                        currentValue: faker_1.faker.number.int({ min: 0, max: 50 }),
                        metric: "PASS_COUNT",
                        expiresAt: faker_1.faker.date.soon({ days: 30 }),
                        status: "ACTIVE",
                    },
                });
            }
            else {
                // 🗳️ Poll Widget
                const poll = yield prisma_1.prisma.widget.create({
                    data: {
                        creatorId: creator.id,
                        type: "POLL",
                        title: faker_1.faker.lorem.words(4),
                        description: faker_1.faker.lorem.sentence(),
                        expiresAt: faker_1.faker.date.soon({ days: 7 }),
                        status: "ACTIVE",
                    },
                });
                const optionCount = faker_1.faker.number.int({ min: 2, max: 4 });
                for (let i = 0; i < optionCount; i++) {
                    yield prisma_1.prisma.pollOption.create({
                        data: {
                            widgetId: poll.id,
                            text: faker_1.faker.lorem.words(3),
                        },
                    });
                }
            }
        }
        console.log("📊 Widgets created for all premium creators.");
        console.log("✅ Seeding complete!");
    });
}
main()
    .catch((e) => {
    console.error("❌ Error seeding data:", e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.prisma.$disconnect();
}));
