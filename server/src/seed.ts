import { faker } from "@faker-js/faker";
import { prisma } from "./lib/prisma";

async function main() {
  console.log(
    "🌱 Seeding Users, Passes, Ownerships, Posts, Media & Widgets..."
  );

  const users = await Promise.all(
    Array.from({ length: 25 }).map(() =>
      prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          emailVerified: faker.datatype.boolean(),
          image: faker.image.avatar(),
          wallet: faker.finance.ethereumAddress(),
          nonce: faker.string.alphanumeric(8),
          onboarded: faker.datatype.boolean(),
        },
      })
    )
  );

  console.log(`👤 Created ${users.length} users.`);

  const premiumCreators = users.slice(0, 10);
  const passes = await Promise.all(
    premiumCreators.map((creator) =>
      prisma.pass.create({
        data: {
          creatorId: creator.id,
          tokenMint: faker.string.alphanumeric(32),
          vault_address: faker.finance.ethereumAddress(),
          price: faker.number.float({ min: 5, max: 50 }),
        },
      })
    )
  );

  console.log(`💳 Created ${passes.length} passes.`);

  for (const user of users) {
    const ownedPasses = faker.helpers.arrayElements(
      passes,
      faker.number.int({ min: 0, max: 3 })
    );

    for (const pass of ownedPasses) {
      if (pass.creatorId === user.id) continue;
      await prisma.ownership.create({
        data: {
          userId: user.id,
          passId: pass.id,
          creatorId: pass.creatorId,
        },
      });
    }
  }

  console.log("🪪 Ownerships assigned.");

  const posts = await Promise.all(
    Array.from({ length: 40 }).map(() =>
      prisma.post.create({
        data: {
          creatorId: faker.helpers.arrayElement(users).id,
          caption: faker.lorem.sentence(),
          isPremium: faker.datatype.boolean(),
        },
      })
    )
  );

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
    const count = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < count; i++) {
      const imageUrl = faker.helpers.arrayElement(unsplashImages);
      await prisma.media.create({
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
    const widgetType = faker.helpers.arrayElement(["GOAL", "POLL"]);

    if (widgetType === "GOAL") {
      await prisma.widget.create({
        data: {
          creatorId: creator.id,
          type: "GOAL",
          title: faker.company.catchPhrase(),
          description: faker.lorem.sentence(),
          targetValue: faker.number.int({ min: 5, max: 100 }),
          currentValue: faker.number.int({ min: 0, max: 50 }),
          metric: "PASS_COUNT",
          expiresAt: faker.date.soon({ days: 30 }),
          status: "ACTIVE",
        },
      });
    } else {
      // 🗳️ Poll Widget
      const poll = await prisma.widget.create({
        data: {
          creatorId: creator.id,
          type: "POLL",
          title: faker.lorem.words(4),
          description: faker.lorem.sentence(),
          expiresAt: faker.date.soon({ days: 7 }),
          status: "ACTIVE",
        },
      });

      const optionCount = faker.number.int({ min: 2, max: 4 });
      for (let i = 0; i < optionCount; i++) {
        await prisma.pollOption.create({
          data: {
            widgetId: poll.id,
            text: faker.lorem.words(3),
          },
        });
      }
    }
  }

  console.log("📊 Widgets created for all premium creators.");
  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
