import {
  ChatCompletionMessage,
  ChatCompletionTool,
} from "openai/src/resources/index.js";
import * as docsTool from "../tools/QueryDocsTool.js";
import { readFile } from "../utils/FileReader.js";
import { Agent, ToolCall } from "./Agent.js";

const system_message = await readFile("./src/prompts/docs_prompt.md");

export class DocsAgent extends Agent {
  protected tools: ChatCompletionTool[] = [docsTool.description];
  protected systemMessage = system_message;

  constructor(chatId: string | undefined) {
    super(chatId);
  }

  protected async callTool(toolCall: ToolCall): Promise<ChatCompletionMessage> {
    let tool_response;

    switch (toolCall.toolName) {
      case "query_documentation":
        tool_response = await docsTool.run(toolCall.args);
        break;
      default:
        tool_response = "That tool does not exist. Don't use this function";
    }

    return this.talkToLLM({
      role: "tool",
      content: tool_response,
      tool_call_id: toolCall.id,
    });
  }
}
