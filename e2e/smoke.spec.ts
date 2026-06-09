import { expect, test } from "@playwright/test";

test("lock screen is visible on first load", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/ARTIST|נעילה|קוד/i).first()).toBeVisible({ timeout: 15_000 });
});

test("health endpoint responds", async ({ request }) => {
  const res = await request.get("/api/health");
  expect([200, 503]).toContain(res.status());
  const body = await res.json();
  expect(body).toHaveProperty("service", "artist-2.0");
});
