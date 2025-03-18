import {
  ChatCompletionMessage,
  ChatCompletionTool,
} from "openai/src/resources/index.js";
import * as location_tool from "../tools/LocationTool.js";
import * as weather_tool from "../tools/WeatherTool.js";
import * as image_tool from "../tools/ImageTool.js";
import { readFile } from "../utils/FileReader.js";
import { Agent, ToolCall } from "./Agent.js";

const system_message = await readFile("./src/prompts/weather_prompt.md");

export class WeatherAgent extends Agent {
  protected tools: ChatCompletionTool[] = [
    location_tool.description,
    weather_tool.description,
    image_tool.description,
  ];
  protected systemMessage = system_message;

  constructor(chatId: string | undefined) {
    super(chatId);
  }

  protected async callTool(toolCall: ToolCall): Promise<ChatCompletionMessage> {
    let tool_response;

    switch (toolCall.toolName) {
      case "getLocation":
        tool_response = await location_tool.run();
        break;
      case "getWeather":
        tool_response = await weather_tool.run(toolCall.args);
        break;
      case "generateImage":
        tool_response = await image_tool.run(toolCall.args);
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
