import { WeatherAgent } from "./agents/WeatherAgent.js";
import { DocsAgent } from "./agents/DocsAgent.js";
import { Agent } from "./agents/Agent.js";

export const agentOptions = ["weather", "docs"];

export function getAgent(
  requestedAgent: string | undefined,
  chatId: string | undefined
) {
  switch (requestedAgent) {
    case "weather":
      return new WeatherAgent(chatId);
    case "docs":
      return new DocsAgent(chatId);
    default:
      return new Agent(undefined);
  }
}
