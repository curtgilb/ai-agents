import { z } from "zod";
import { zodFunction } from "openai/helpers/zod";
import { WeatherResponse, GeocodeResponse } from "./Tool.d.js";

const parameters = z.object({
  location: z.union([
    z.string().describe("City and country e.g. San Francisco, California"),
    z
      .object({
        lon: z.number().describe("Longitude of the location"),
        lat: z.number().describe("Latitude of the location"),
      })
      .describe("Coordinates of the location"),
  ]),
});

const description = zodFunction({ name: "getWeather", parameters: parameters });

async function run(params: z.infer<typeof parameters>): Promise<string> {
  let lon, lat;
  if (typeof params.location === "string") {
    const location = await getCityCoordinates(params.location);
    if (!location) {
      return "Invalid location, please provide a valid city name";
    }
    lon = location.lon;
    lat = location.lat;
  } else if (params.location?.lon && params.location?.lat) {
    lon = params.location.lon;
    lat = params.location.lat;
  } else {
    return "Invalid location, please provide a city name or longitude and latitude coordinates";
  }
  const weather = await getWeather(lat, lon);
  return JSON.stringify(weather, null, 2);
}

async function getWeather(lat: number, lon: number): Promise<WeatherResponse> {
  const api_key = process.env.WEATHER_API_KEY;
  if (!api_key) {
    throw new Error("API key not found");
  }

  const endpoint = new URL("https://api.openweathermap.org/data/2.5/weather");
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    appid: api_key,
    units: "imperial",
  });

  endpoint.search = params.toString();

  const response = await fetch(endpoint.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error status: ${response.status}`);
  }

  return await response.json();
}

async function getCityCoordinates(
  city_name: string
): Promise<GeocodeResponse | null> {
  const api_key = process.env.WEATHER_API_KEY;
  if (!api_key) {
    throw new Error("API key not found");
  }

  const response = await fetch(
    `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURI(city_name)}&limit=1&appid=${api_key}`,
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

  const matching_locations = await response.json();
  return matching_locations.length > 0 ? matching_locations[0] : null;
}

export { run, description };
