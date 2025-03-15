import "dotenv/config";
import readline from "readline";
import { showLoading } from "./utils/Loader.js";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { v4 as uuidv4 } from "uuid";
import { sendMessage } from "./agents/WeatherAgent.js";

const argv = await yargs(hideBin(process.argv))
  .option("agent", {
    alias: "a",
    type: "string",
    description: "What ai agent to use",
    choices: ["weather", "docs"],
    demandOption: true,
    default: "weather",
  })
  .option("id", {
    type: "string",
    description: "ID of previous chat",
  })
  .parse();

const chatId = argv.id || uuidv4();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function waitForResponse() {
  rl.question("You: ", async (userInput) => {
    const clearLoader = showLoading();
    console.log(userInput);

    // Simulate some processing time
    const response = await sendMessage({
      chatId,
      message: { role: "user", content: userInput },
    });

    clearLoader();

    console.log(`Assistant: ${response}`);
    waitForResponse();
  });
}

waitForResponse();
