import { expect, type Page } from "@playwright/test";

export class LoginPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto("/login");
    await expect(
      this.page.getByRole("heading", { name: "Đăng nhập", level: 1 }),
    ).toBeVisible();
  }

  async login(email: string, pass: string) {
    await this.page.getByLabel("Email", { exact: true }).fill(email);
    await this.page.getByLabel("Mật khẩu", { exact: true }).fill(pass);
    await Promise.all([
      this.page.waitForURL((url) => url.pathname === "/"),
      this.page.getByRole("button", { name: "Đăng nhập", exact: true }).click(),
    ]);
  }
}
