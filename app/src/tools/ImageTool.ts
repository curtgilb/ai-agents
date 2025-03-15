import { z } from "zod";
import { openai } from "../clients/OpenAI.js";
import { zodFunction } from "openai/helpers/zod";

const parameters = z.object({
  prompt: z
    .string()
    .describe(
      "Prompt to generate the image of the weather at location. Please provide details like city landmarks if possible. "
    ),
});

const description = zodFunction({
  name: "generateImage",
  parameters: parameters,
});

async function run({ prompt }: z.infer<typeof parameters>): Promise<string> {
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: prompt,
    n: 1,
    size: "1024x1024",
  });

  return response.data[0].url || "Image could not be generated, try again.";
}

export { run, description };
