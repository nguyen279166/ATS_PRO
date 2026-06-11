import { expect, Page } from "@playwright/test";

export class JobsPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto("/jobs");
  }

  async createJob(title: string, dept: string, loc: string, desc: string) {
    await this.page.locator('button:has-text("Tạo tin mới")').click();
    await this.page
      .locator('input[placeholder="Ví dụ: Frontend Engineer"]')
      .fill(title);
    await this.page.locator('input[placeholder="Ví dụ: Tech"]').fill(dept);
    await this.page.locator('input[placeholder="Ví dụ: Hà Nội"]').fill(loc);
    await this.page
      .locator('textarea[placeholder="Nhập chi tiết yêu cầu công việc..."]')
      .fill(desc);
    await this.page
      .locator('button[type="submit"]:has-text("Đăng tuyển")')
      .click();
  }

  async verifyJobExists(title: string) {
    await expect(this.page.locator(`h3:has-text("${title}")`).first()).toBeVisible({
      timeout: 5000,
    });
  }

  async deleteJob(title: string) {
    const jobCard = this.page
      .locator(`.sahara-card:has(h3:has-text("${title}"))`)
      .first();
    const deleteBtn = jobCard.locator('button[title*="Admin"]');

    this.page.once("dialog", async (dialog) => {
      await dialog.accept();
    });

    await deleteBtn.click();
  }

  async verifyDeleteButtonVisible(title: string, visible: boolean) {
    const jobCard = this.page
      .locator(`.sahara-card:has(h3:has-text("${title}"))`)
      .first();
    const deleteBtn = jobCard.locator('button[title*="Admin"]');
    if (visible) {
      await expect(deleteBtn).toBeVisible();
    } else {
      await expect(deleteBtn).not.toBeVisible();
    }
  }
}
