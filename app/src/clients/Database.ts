import { components, operations } from "../api-types.js";

const API_BASE_URL = "http://python:8000";

export async function fetchQuery(
  query: string
): Promise<components["schemas"]["QueryResponse"]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/query?query=${encodeURIComponent(query)}`
    );
    if (!response.ok) {
      if (response.status === 422) {
        const validationError: components["schemas"]["HTTPValidationError"] =
          await response.json();
        console.error("Validation error:", validationError);
        throw new Error("Validation error");
      } else {
        console.error("Error fetching query:", response.statusText);
        throw new Error("Error fetching query");
      }
    }
    const data: components["schemas"]["QueryResponse"] = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching query:", error);
    throw error;
  }
}
