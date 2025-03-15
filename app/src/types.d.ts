import { ChatCompletionMessageParam } from "openai/src/resources/index.js";

export type Message = {
  message: ChatCompletionMessageParam;
  chatId: string;
};
