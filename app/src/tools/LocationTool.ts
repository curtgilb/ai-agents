import { z } from "zod";
import { zodFunction } from "openai/helpers/zod";
import { LocationResponse } from "./WeatherToolTypes.js";

const parameters = z.object({});

const description = zodFunction({
  name: "getLocation",
  parameters: parameters,
});

async function run(): Promise<string> {
  const response = await fetch(
    "http://ip-api.com/json/?fields=status,message,country,regionName,city,lat,lon,query",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error status: ${response.status}`);
  }

  const data = (await response.json()) as LocationResponse;

  return JSON.stringify(data, null, 2);
}

export { run, description };
