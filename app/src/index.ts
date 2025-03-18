import "dotenv/config";
import readline from "readline";
import { showLoading } from "./utils/Loader.js";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { v4 as uuidv4 } from "uuid";
import { agentOptions, getAgent } from "./AgentFactory.js";

const argv = await yargs(hideBin(process.argv))
  .option("agent", {
    alias: "a",
    type: "string",
    description: "What ai agent to use",
    choices: agentOptions,
  })
  .option("id", {
    type: "string",
    description: "ID of previous chat",
  })
  .parse();

const chatId = argv.id || uuidv4();
const agent = getAgent("weather", chatId);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function waitForResponse() {
  rl.question("You: ", async (userInput) => {
    const clearLoader = showLoading();

    // Simulate some processing time
    const response = await agent.ask(userInput);

    clearLoader();

    console.log(`Agent: ${response}`);
    waitForResponse();
  });
}

waitForResponse();
