import { test, expect } from "@playwright/test";
test("menu, recommendation, cart, checkout and reset", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass("dark");
  await expect(
    page.getByRole("heading", { name: "滷肉飯", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "加入滷肉飯", exact: true }).click();
  await page.getByRole("button", { name: "增加滷肉飯", exact: true }).click();
  await expect(page.getByText("合計（2 份）")).toBeVisible();
  await expect(page.locator("strong")).toHaveText("NT$ 130");
  await page.getByRole("button", { name: "減少滷肉飯", exact: true }).click();
  await expect(page.locator("strong")).toHaveText("NT$ 65");
  await page.getByRole("button", { name: "模擬結帳", exact: true }).click();
  await page.getByRole("button", { name: "返回修改" }).click();
  await page.getByRole("button", { name: "移除滷肉飯" }).click();
  await expect(
    page.getByRole("button", { name: "模擬結帳", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "幫我選一餐" }).click();
  await page.getByRole("button", { name: "加入這道餐點" }).click();
  await page.getByRole("button", { name: "模擬結帳", exact: true }).click();
  await page.getByRole("button", { name: "確認模擬結帳" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "模擬訂單完成，未實際送出。",
  );
  await page.getByRole("button", { name: "加入滷肉飯", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "滷肉飯", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("合計（0 份）")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/${test.info().project.name}.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("load error can retry and empty menu is explained", async ({ page }) => {
  await page.route("**/api/items", (route) =>
    route.fulfill({ status: 500, body: "{}" }),
  );
  await page.goto("/");
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "菜單載入失敗",
  );
  await page.unroute("**/api/items");
  await page.getByRole("button", { name: "重新載入" }).click();
  await expect(
    page.getByRole("heading", { name: "滷肉飯", exact: true }),
  ).toBeVisible();
  await page.route("**/api/items/random", (route) =>
    route.fulfill({ status: 500, body: "{}" }),
  );
  await page.getByRole("button", { name: "幫我選一餐" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "暫時無法推薦",
  );
  await page.route("**/api/items", (route) =>
    route.fulfill({ json: { items: [] } }),
  );
  await page.reload();
  await expect(page.getByText("目前沒有餐點，請稍後再來。")).toBeVisible();
  await expect(page.getByRole("button", { name: "幫我選一餐" })).toBeDisabled();
});
