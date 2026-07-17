import { expect, test } from "@playwright/test";

test.describe("Các trang công khai không phụ thuộc cơ sở dữ liệu", () => {
  test("điều hướng qua đăng nhập, đăng ký và quên mật khẩu", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: "Đăng nhập", level: 1 }),
    ).toBeVisible();
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Mật khẩu", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Đăng ký ngay" }).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(
      page.getByRole("heading", { name: "Tạo tài khoản", level: 1 }),
    ).toBeVisible();
    await expect(page.getByLabel("Họ và tên", { exact: true })).toBeVisible();
    await expect(
      page.getByLabel("Địa chỉ email", { exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Giới tính", { exact: true })).toBeVisible();
    await expect(
      page.getByLabel("Tôi đồng ý với điều khoản dịch vụ"),
    ).toBeVisible();

    await page
      .getByRole("link", { name: "Đăng nhập", exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/login$/);
    await page.getByRole("link", { name: "Quên mật khẩu?" }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(
      page.getByRole("heading", { name: "Quên mật khẩu", level: 1 }),
    ).toBeVisible();
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Gửi email khôi phục" }),
    ).toBeVisible();
  });

  test("trang tuyển dụng hoạt động ở màn hình di động 375px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.route("**/api/public/jobs", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      });
    });

    await page.goto("/careers");
    await expect(
      page.getByRole("heading", {
        name: "Cơ hội nghề nghiệp tại ATS PRO",
        level: 1,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Điều hướng chính" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Vị trí đang tuyển", level: 2 }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Chưa có vị trí đang mở", level: 3 }),
    ).toBeVisible();

    const viewport = await page.evaluate(() => ({
      contentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(viewport.contentWidth).toBeLessThanOrEqual(viewport.viewportWidth);

    await page
      .getByRole("link", { name: "Xem vị trí đang tuyển" })
      .click();
    await expect(page).toHaveURL(/\/careers#jobs$/);
  });
});

test.describe("Điều hướng responsive với dữ liệu được mock", () => {
  test("sidebar mobile quản lý focus và mở khóa cuộn khi đổi viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.addInitScript(() => {
      localStorage.setItem("token_lay_duoc", "playwright-smoke-token");
    });
    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ fullName: "Người dùng thử", role: "hr" }),
      });
    });
    await page.route("**/api/jobs", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      });
    });
    await page.route("**/api/candidates**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [],
          pagination: { page: 1, limit: 1000, total: 0, totalPages: 0 },
        }),
      });
    });

    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Tổng quan tuyển dụng", level: 1 }),
    ).toBeVisible();

    const sidebar = page.locator('aside[aria-label="Điều hướng chính"]');
    const menuButton = page.getByRole("button", {
      name: "Mở menu điều hướng",
    });
    await expect(sidebar).toHaveAttribute("aria-hidden", "true");
    await expect(sidebar).toHaveAttribute("inert", "");

    await menuButton.click();
    await expect(sidebar).toHaveAttribute("aria-hidden", "false");
    await expect(
      page.getByRole("button", { name: "Đóng menu điều hướng" }),
    ).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(sidebar).toHaveAttribute("aria-hidden", "true");
    await expect(menuButton).toBeFocused();

    await menuButton.click();
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(sidebar).toHaveAttribute("aria-hidden", "false");
    await expect
      .poll(() => page.evaluate(() => document.body.style.overflow))
      .not.toBe("hidden");
  });
});
