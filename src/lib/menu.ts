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
  const ids = new Set<string>();
  return value.items.map((item: unknown) => {
    if (!item || typeof item !== "object") throw new Error("Invalid menu item");
    const record = item as Record<string, unknown>;
    for (const key of ["id", "name", "description", "category"]) {
      if (typeof record[key] !== "string" || !record[key].trim())
        throw new Error(`Invalid item ${key}`);
    }
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.id as string) ||
      record.id === "random"
    )
      throw new Error("Invalid or reserved item id");
    if (
      !Number.isSafeInteger(record.price) ||
      (record.price as number) < 0 ||
      (record.price as number) > 1_000_000
    )
      throw new Error("Invalid item price");
    const result = record as MenuItem;
    if (ids.has(result.id)) throw new Error(`Duplicate item id: ${result.id}`);
    ids.add(result.id);
    return {
      id: result.id,
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
