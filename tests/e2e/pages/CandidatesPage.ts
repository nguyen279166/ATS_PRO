import { Page, expect } from "@playwright/test";

export class CandidatesPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto("/candidates");
  }

  async verifyExportVisible(visible: boolean) {
    const excelBtn = this.page.locator('button:has-text("Excel")');
    const pdfBtn = this.page.locator('button:has-text("PDF")');
    if (visible) {
      await expect(excelBtn).toBeVisible({ timeout: 5000 });
      await expect(pdfBtn).toBeVisible({ timeout: 5000 });
    } else {
      await expect(excelBtn).not.toBeVisible();
      await expect(pdfBtn).not.toBeVisible();
    }
  }
}
