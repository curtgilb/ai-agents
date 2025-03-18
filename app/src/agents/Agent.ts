import {
  ChatCompletionMessage,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
  ChatCompletionTool,
} from "openai/src/resources/index.js";
import { openai } from "../clients/OpenAI.js";
import { addMessageToThread, getMessagesFromThread } from "../clients/Redis.js";
import { readFile } from "../utils/FileReader.js";

export type ToolCall = {
  toolName: string;
  args: any;
  id: string;
};

const system_message = await readFile("./src/prompts/base_prompt.md");

// Make sure to override tools, system message, callTool
export class Agent {
  protected tools: ChatCompletionTool[] | undefined = undefined;
  protected loopLimit: number = 6;
  protected loopCount: number = 0;
  protected systemMessage: string = system_message;
  protected chatId: string | undefined;

  constructor(chatId: string | undefined) {
    this.chatId = chatId;
  }

  protected async talkToLLM(message: ChatCompletionMessageParam) {
    // Retrieve the previous chat messages
    const messageHistory = this.chatId
      ? await getMessagesFromThread(this.chatId)
      : [];

    // Send the message to the OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: this.systemMessage },
        ...messageHistory,
        message,
      ],
      tools: this.tools,
      parallel_tool_calls: !this.tools ? undefined : false,
    });
    const choice = completion.choices[0].message;

    // Save messages to database
    if (this.chatId) await addMessageToThread(this.chatId, message, choice);

    return choice;
  }

  public async ask(request: string) {
    let llmResponse = await this.talkToLLM({
      role: "user",
      content: request,
    });

    // If LLM wants to call tool, call tool and any additional calls it may have
    while ("tool_calls" in llmResponse && llmResponse.tool_calls) {
      if (this.loopCount >= this.loopLimit) throw Error("Exceeded loop limit");
      const tool_call = this.extractToolInfo(llmResponse.tool_calls[0]);
      llmResponse = await this.callTool(tool_call);
      this.loopCount++;
    }

    return llmResponse.content;
  }

  protected extractToolInfo(toolCall: ChatCompletionMessageToolCall): ToolCall {
    const toolName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);
    const id = toolCall.id;
    return { toolName, args, id };
  }

  protected async callTool(toolCall: ToolCall): Promise<ChatCompletionMessage> {
    throw Error(
      "Should not call functions. No functions available in base agent"
    );
  }
}
