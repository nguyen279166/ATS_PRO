import { Page, expect } from "@playwright/test";

export class SidebarComponent {
  constructor(private page: Page) {}

  async verifyRole(role: "admin" | "hr") {
    const roleText = role === "admin" ? "⚡ Admin" : "HR";
    await expect(this.page.locator(`span:has-text("${roleText}")`)).toBeVisible({ timeout: 10000 });
  }

  async clickMenu(name: "Dashboard" | "Jobs" | "Candidates" | "Settings") {
    await this.page.locator(`nav span:has-text("${name}")`).click();
  }

  async logout() {
    await this.page.locator('button[title="Đăng xuất"]').click();
  }
}
