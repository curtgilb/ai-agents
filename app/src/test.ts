import "dotenv/config";
import { WeatherAgent } from "./agents/WeatherAgent.js";
import { DocsAgent } from "./agents/DocsAgent.js";

const agent = new DocsAgent("curt");
const response = await agent.ask("How do I install AutoGPT?");
console.log(response);
