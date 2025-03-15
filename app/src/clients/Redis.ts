import { Redis } from "ioredis";
import { Message } from "../types.d.js";
import { ChatCompletionMessageParam } from "openai/src/resources/index.js";

const redis = new Redis({
  host: "redis",
  port: 6379,
});

const CHAT_THREAD_PREFIX = "chat:thread:";

async function addMessageToThread(
  threadId: string,
  ...messages: ChatCompletionMessageParam[]
): Promise<void> {
  const key = `${CHAT_THREAD_PREFIX}${threadId}`;
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
  const key = `${CHAT_THREAD_PREFIX}${threadId}`;
  try {
    const messages = await redis.lrange(key, 0, -1);
    return messages.map((msg) => JSON.parse(msg) as ChatCompletionMessageParam);
  } catch (error) {
    console.error(`Failed to get messages from thread ${threadId}:`, error);
    return [];
  }
}

async function disconnect(): Promise<void> {
  try {
    await redis.quit();
    console.log("Disconnected from Redis");
  } catch (error) {
    console.error("Failed to disconnect from Redis:", error);
  }
}

export { addMessageToThread, getMessagesFromThread, disconnect };
