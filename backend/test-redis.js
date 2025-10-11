import { redis } from "./lib/redis.js";

async function testRedis() {
  try {
    console.log("Testing Redis connection...");

    // Test connection
    await redis.set("test", "Hello Redis");
    const value = await redis.get("test");
    console.log("✅ Redis test successful:", value);

    await redis.del("test");
    process.exit(0);
  } catch (error) {
    console.error("❌ Redis connection failed:", error.message);
    process.exit(1);
  }
}

testRedis();
