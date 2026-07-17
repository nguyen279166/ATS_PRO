import { expect, type Page } from "@playwright/test";

export type SidebarMenuName =
  | "Tổng quan"
  | "Tin tuyển dụng"
  | "Ứng viên"
  | "Cài đặt";

export class SidebarComponent {
  constructor(private page: Page) {}

  private get sidebar() {
    return this.page.getByRole("complementary", {
      name: "Điều hướng chính",
    });
  }

  async verifyRole(role: "admin" | "hr") {
    const roleText = role === "admin" ? "Admin" : "HR";
    await expect(this.sidebar.getByText(roleText, { exact: true })).toBeVisible({
      timeout: 10000,
    });
  }

  async clickMenu(name: SidebarMenuName) {
    await this.sidebar.getByRole("link", { name, exact: true }).click();
  }

  async logout() {
    await this.sidebar.getByRole("button", { name: "Đăng xuất" }).click();
  }
}
