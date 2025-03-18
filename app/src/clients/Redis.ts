import { Redis } from "ioredis";
import { ChatCompletionMessageParam } from "openai/src/resources/index.js";

const redis = new Redis({
  host: "redis",
  port: 6379,
});

function generateKey(threadId: string) {
  const CHAT_THREAD_PREFIX = "chat:thread:";
  return `${CHAT_THREAD_PREFIX}${threadId}`;
}

async function addMessageToThread(
  threadId: string,
  ...messages: ChatCompletionMessageParam[]
): Promise<void> {
  const key = generateKey(threadId);
  try {
    const serializedMessages = messages.map((message) =>
      JSON.stringify(message)
    );
    await redis.rpush(key, ...serializedMessages);
  } catch (error) {
    console.error(`Failed to add messages to thread ${threadId}:`, error);
  }
}

async function getMessagesFromThread(
  threadId: string
): Promise<ChatCompletionMessageParam[]> {
  const key = generateKey(threadId);
  try {
    const messages = await redis.lrange(key, 0, -1);
    return messages.map((msg) => JSON.parse(msg) as ChatCompletionMessageParam);
  } catch (error) {
    console.error(`Failed to get messages from thread ${threadId}:`, error);
    return [];
  }
}

async function threadExists(threadId: string): Promise<boolean> {
  const key = generateKey(threadId);

  const exists = await redis.exists(key);

  return exists === 1;
}

async function disconnect(): Promise<void> {
  try {
    await redis.quit();
    console.log("Disconnected from Redis");
  } catch (error) {
    console.error("Failed to disconnect from Redis:", error);
  }
}

export { addMessageToThread, getMessagesFromThread, disconnect, threadExists };
