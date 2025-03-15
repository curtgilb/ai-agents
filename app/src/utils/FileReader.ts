import { promises as fs } from "fs";

export async function readFile(filePath: string): Promise<string> {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return data;
  } catch (error) {
    throw new Error(`Error reading file: ${error}`);
  }
}
