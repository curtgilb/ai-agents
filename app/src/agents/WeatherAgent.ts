import { getMessagesFromThread, addMessageToThread } from "../clients/Redis.js";
import { openai } from "../clients/OpenAI.js";
import * as location_tool from "../tools/LocationTool.js";
import * as weather_tool from "../tools/WeatherTool.js";
import { Message } from "../types.d.js";
import { readFile } from "../utils/FileReader.js";

const tools = [location_tool.description, weather_tool.description];

const system_message = await readFile("./src/prompts/weather_prompt.md");

export async function sendMessage({
  message,
  chatId,
}: Message): Promise<string | void> {
  // Retrieve the previous chat messages
  const messageHistory = await getMessagesFromThread(chatId);

  // Send the message to the OpenAI API
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system_message },
      ...messageHistory,
      message,
    ],
    tools,
    parallel_tool_calls: false,
  });

  const response = completion.choices[0].message;

  // Save messages to database
  await addMessageToThread(chatId, message, response);

  if ("tool_calls" in response && response.tool_calls) {
    // Call tool
    const tool_call = response.tool_calls[0];

    await handleToolCall({
      toolName: tool_call.function.name,
      args: JSON.parse(tool_call.function.arguments),
      chatId,
      toolCallId: tool_call.id,
    });
  }

  return response.content || "Sorry, I didn't understand that.";
}

type ToolCallParameters = {
  toolName: string;
  toolCallId: string;
  chatId: string;
  args: any;
};

async function handleToolCall({
  toolName,
  args,
  chatId,
  toolCallId,
}: ToolCallParameters) {
  let tool_response;

  switch (toolName) {
    case "getLocation":
      tool_response = await location_tool.run();
      break;
    case "getWeather":
      tool_response = await weather_tool.run(args);
      break;
    case "generateImage":
      tool_response = await weather_tool.run(args);
      break;
    default:
      tool_response = "That tool does not exist. Don't use this function";
  }

  await sendMessage({
    chatId,
    message: { role: "tool", content: tool_response, tool_call_id: toolCallId },
  });
}

const response = await sendMessage({
  chatId: "12",
  message: {
    role: "user",
    content: "What's the weather like in new York city?",
  },
});
console.log(response);
