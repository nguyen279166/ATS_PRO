import { expect, type Page } from "@playwright/test";

export class CandidatesPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto("/candidates");
  }

  async verifyExportVisible(visible: boolean) {
    const exportRegion = this.page.getByLabel("Xuất báo cáo");
    const excelBtn = exportRegion.getByRole("button", {
      name: "Excel",
      exact: true,
    });
    const pdfBtn = exportRegion.getByRole("button", {
      name: "PDF",
      exact: true,
    });
    if (visible) {
      await expect(excelBtn).toBeVisible({ timeout: 5000 });
      await expect(pdfBtn).toBeVisible({ timeout: 5000 });
    } else {
      await expect(exportRegion).toHaveCount(0);
    }
  }
}
