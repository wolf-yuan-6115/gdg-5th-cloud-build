import { readFile } from "node:fs/promises";
import { randomInt } from "node:crypto";
import path from "node:path";
import type { MenuItem } from "./types";

export function parseMenu(value: unknown): MenuItem[] {
  if (
    !value ||
    typeof value !== "object" ||
    !("items" in value) ||
    !Array.isArray(value.items)
  )
    throw new Error("config.items must be an array");
  return value.items.map((item: unknown, index: number) => {
    if (!item || typeof item !== "object") throw new Error("Invalid menu item");
    const record = item as Record<string, unknown>;
    for (const key of ["name", "description", "category"]) {
      if (typeof record[key] !== "string" || !record[key].trim())
        throw new Error(`Invalid item ${key}`);
    }
    if (
      !Number.isSafeInteger(record.price) ||
      (record.price as number) < 0 ||
      (record.price as number) > 1_000_000
    )
      throw new Error(
        `Item ${index + 1} ("${record.name}"): price must be an integer between 0 and 1000000; received ${JSON.stringify(record.price)}`,
      );
    const result = record as Omit<MenuItem, "id">;
    return {
      id: `item-${index + 1}`,
      name: result.name,
      description: result.description,
      category: result.category,
      price: result.price,
    };
  });
}
export async function readMenu() {
  return parseMenu(
    JSON.parse(await readFile(path.join(process.cwd(), "config.json"), "utf8")),
  );
}
export function chooseItem(items: MenuItem[]): MenuItem | undefined {
  return items.length ? items[randomInt(items.length)] : undefined;
}
