import { expect, test } from "@playwright/test";

const job = {
  id: "job-ui-preview",
  title: "Senior Product Designer",
  department: "Sản phẩm",
  location: "Hồ Chí Minh · Hybrid",
  status: "Open",
  createdAt: "2026-06-18T08:00:00.000Z",
};

const candidates = [
  {
    id: "candidate-1",
    jobId: job.id,
    name: "Nguyễn Minh Anh",
    email: "minhanh@example.com",
    status: "Applied",
    appliedDate: "2026-07-15T08:00:00.000Z",
    cvUrl: "/uploads/minh-anh.pdf",
    cvFileName: "CV-Nguyen-Minh-Anh.pdf",
  },
  {
    id: "candidate-2",
    jobId: job.id,
    name: "Trần Hoàng Nam",
    email: "hoangnam@example.com",
    status: "Applied",
    appliedDate: "2026-07-13T08:00:00.000Z",
  },
  {
    id: "candidate-3",
    jobId: job.id,
    name: "Lê Phương Thảo",
    email: "phuongthao@example.com",
    status: "Interviewing",
    appliedDate: "2026-07-09T08:00:00.000Z",
    cvUrl: "/uploads/phuong-thao.pdf",
    cvFileName: "CV-Le-Phuong-Thao.pdf",
  },
  {
    id: "candidate-4",
    jobId: job.id,
    name: "Vũ Gia Huy",
    email: "giahuy@example.com",
    status: "Interviewing",
    appliedDate: "2026-07-04T08:00:00.000Z",
  },
  {
    id: "candidate-5",
    jobId: job.id,
    name: "Đỗ Ngọc Linh",
    email: "ngoclinh@example.com",
    status: "Hired",
    appliedDate: "2026-06-28T08:00:00.000Z",
    cvUrl: "/uploads/ngoc-linh.pdf",
    cvFileName: "CV-Do-Ngoc-Linh.pdf",
  },
  {
    id: "candidate-6",
    jobId: job.id,
    name: "Phạm Quốc Bảo",
    email: "quocbao@example.com",
    status: "Rejected",
    appliedDate: "2026-06-21T08:00:00.000Z",
  },
];

test("Kanban mới có hierarchy rõ và không tràn ngang", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    localStorage.setItem("token_lay_duoc", "playwright-kanban-visual-token");
  });
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ fullName: "Nguyễn Hà", role: "hr" }),
    });
  });
  await page.route("**/api/jobs", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([job]),
    });
  });
  await page.route("**/api/candidates**", async (route) => {
    if (route.request().method() === "PUT") {
      const { status } = route.request().postDataJSON() as { status: string };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          candidate: { ...candidates[0], status },
          notification: { attempted: false },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: candidates,
        pagination: { page: 1, limit: 1000, total: candidates.length, totalPages: 1 },
      }),
    });
  });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/jobs/${job.id}`);

  await expect(
    page.getByRole("heading", { name: job.title, level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mới ứng tuyển" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Đang phỏng vấn" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Đã tuyển" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Từ chối" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Mở chi tiết ứng viên Nguyễn Minh Anh" }),
  ).toBeVisible();
  const stagePicker = page.locator("#candidate-status-candidate-1");
  await expect(stagePicker).toBeVisible();
  await expect(stagePicker).toHaveAttribute("role", "combobox");
  await expect(stagePicker).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator('img[src="/ats-pro-logo.svg"]')).toBeVisible();

  await stagePicker.focus();
  await page.keyboard.press("Enter");
  const stageListbox = page.getByRole("listbox", {
    name: /Chuyển giai đoạn cho/,
  });
  await expect(stagePicker).toHaveAttribute("aria-expanded", "true");
  await expect(stageListbox).toBeVisible();
  await expect(
    stageListbox.getByRole("option", { name: /Mới ứng tuyển/ }),
  ).toHaveAttribute("aria-selected", "true");
  await page.screenshot({
    path: testInfo.outputPath("kanban-stage-picker-light.png"),
    fullPage: false,
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  await expect(stageListbox).toBeHidden();
  await expect(stagePicker).toBeFocused();

  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowDown");
  await expect(stagePicker).toHaveAttribute(
    "aria-activedescendant",
    /interviewing$/,
  );
  await page.keyboard.press("Escape");

  await page.screenshot({
    path: testInfo.outputPath("kanban-desktop.png"),
    fullPage: true,
  });

  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.waitForTimeout(250);
  await expect(
    page.getByRole("heading", { name: job.title, level: 1 }),
  ).toHaveCSS("color", "rgb(255, 255, 255)");
  await stagePicker.focus();
  await page.keyboard.press("Enter");
  await expect(stageListbox).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("kanban-stage-picker-dark.png"),
    fullPage: false,
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  await page.screenshot({
    path: testInfo.outputPath("kanban-desktop-dark.png"),
    fullPage: true,
  });
  await page.evaluate(() => document.documentElement.classList.remove("dark"));
  await page.waitForTimeout(250);

  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Tổng quan tuyển dụng", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("Tổng ứng viên", { exact: true })).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("dashboard-desktop.png"),
    fullPage: true,
  });

  await page.goto(`/jobs/${job.id}`);
  await expect(
    page.getByRole("heading", { name: job.title, level: 1 }),
  ).toBeVisible();

  await page.setViewportSize({ width: 375, height: 812 });
  await expect(
    page.locator('aside[aria-label="Điều hướng chính"]'),
  ).toHaveAttribute("aria-hidden", "true");
  await page.waitForTimeout(250);
  const viewport = await page.evaluate(() => ({
    contentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(viewport.contentWidth).toBeLessThanOrEqual(viewport.viewportWidth);

  await page.screenshot({
    path: testInfo.outputPath("kanban-mobile.png"),
    fullPage: false,
  });

  await stagePicker.scrollIntoViewIfNeeded();
  await stagePicker.focus();
  await page.keyboard.press("Enter");
  await expect(stageListbox).toBeVisible();
  const menuBounds = await stageListbox.boundingBox();
  expect(menuBounds).not.toBeNull();
  expect(menuBounds!.x).toBeGreaterThanOrEqual(0);
  expect(menuBounds!.x + menuBounds!.width).toBeLessThanOrEqual(375);
  expect(menuBounds!.y).toBeGreaterThanOrEqual(0);
  expect(menuBounds!.y + menuBounds!.height).toBeLessThanOrEqual(812);
  await page.screenshot({
    path: testInfo.outputPath("kanban-mobile-stage-picker.png"),
    fullPage: false,
    animations: "disabled",
  });
  await page.keyboard.press("Escape");

  const updateRequestPromise = page.waitForRequest(
    (request) =>
      request.method() === "PUT" &&
      request.url().includes("/api/candidates/candidate-1"),
  );
  await stagePicker.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  const updateRequest = await updateRequestPromise;
  expect(updateRequest.postDataJSON()).toEqual({ status: "Interviewing" });
  await expect(page.locator("#candidate-status-candidate-1")).toHaveAttribute(
    "aria-label",
    /Đang phỏng vấn/,
  );
});
