import { describe, expect, test } from "bun:test";
import { chooseItem, parseMenu, readMenu } from "../src/lib/menu";
import { GET as list } from "../src/app/api/items/route";
import { GET as detail } from "../src/app/api/items/[id]/route";
import { GET as random } from "../src/app/api/items/random/route";
const item = {
  name: "飯",
  description: "示範",
  category: "主食",
  price: 65,
};
describe("menu validation", () => {
  test("accepts valid and empty menus", () => {
    expect(parseMenu({ items: [item] })).toEqual([{ ...item, id: "item-1" }]);
    expect(parseMenu({ items: [] })).toEqual([]);
  });
  test("rejects malformed structure", () => {
    for (const value of [
      null,
      {},
      { items: [null] },
      { items: [{ ...item, name: "" }] },
    ])
      expect(() => parseMenu(value)).toThrow();
  });
  test("generates distinct repeatable IDs even for identical items", () => {
    const menu = { items: [item, item] };
    const parsed = parseMenu(menu);
    expect(parsed.map((entry) => entry.id)).toEqual(["item-1", "item-2"]);
    expect(parseMenu(menu)).toEqual(parsed);
    expect(menu.items[0]).not.toHaveProperty("id");
  });
  test("accepts zero and maximum price", () => {
    for (const price of [0, 1_000_000])
      expect(parseMenu({ items: [{ ...item, price }] })[0].price).toBe(price);
  });
  test("identifies the item with a negative price", () => {
    expect(() => parseMenu({ items: [{ ...item, price: -1 }] })).toThrow(
      'Item 1 ("飯"): price must be an integer between 0 and 1000000; received -1',
    );
  });
  test("rejects invalid prices", () => {
    for (const price of [-1, 1.5, "65", Infinity, 1000001])
      expect(() => parseMenu({ items: [{ ...item, price }] })).toThrow();
  });
  test("selects only from menu and handles empty/single menu", async () => {
    expect(chooseItem([])).toBeUndefined();
    const single = parseMenu({ items: [item] });
    expect(chooseItem(single)).toEqual(single[0]);
    const items = await readMenu();
    for (let i = 0; i < 30; i++) {
      const chosen = chooseItem(items);
      expect(chosen).toBeDefined();
      if (chosen) expect(items).toContainEqual(chosen);
    }
  });
});
test("API responses, missing id and no-store", async () => {
  const response = await list();
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  const { items } = await response.json();
  const found = await detail(new Request("http://localhost"), {
    params: Promise.resolve({ id: items[0].id }),
  });
  expect((await found.json()).item).toEqual(items[0]);
  expect(
    (
      await detail(new Request("http://localhost"), {
        params: Promise.resolve({ id: "missing" }),
      })
    ).status,
  ).toBe(404);
  expect(items).toContainEqual((await (await random()).json()).item);
});
