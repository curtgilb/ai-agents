import { zodFunction } from "openai/helpers/zod";
import { fetchQuery } from "../clients/Database.js";
import { z } from "zod";

const parameters = z.object({
  query: z
    .string()
    .describe(
      "Query to send to vector database about AutoGPT docs. Be sure to include any keywords to improve context."
    ),
});

const description = zodFunction({
  name: "query_documentation",
  parameters: parameters,
});

async function run({ query }: z.infer<typeof parameters>): Promise<string> {
  const results = await fetchQuery(query);

  const concatenatedResult = results.items.map((item) => item.text).join("\n");

  return concatenatedResult;
}

export { description, run };
