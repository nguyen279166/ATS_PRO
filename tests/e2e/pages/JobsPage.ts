import { expect, type Locator, type Page } from "@playwright/test";

type JobFormData = {
  title: string;
  department: string;
  location: string;
  description: string;
};

export class JobsPage {
  constructor(private page: Page) {}

  private jobArticle(title: string) {
    return this.page.getByRole("article").filter({
      has: this.page.getByRole("heading", {
        name: title,
        level: 3,
        exact: true,
      }),
    });
  }

  private async fillJobDialog(dialog: Locator, data: JobFormData) {
    await dialog.getByLabel("Chức danh", { exact: true }).fill(data.title);
    await dialog
      .getByLabel("Phòng ban", { exact: true })
      .fill(data.department);
    await dialog.getByLabel("Địa điểm", { exact: true }).fill(data.location);
    await dialog
      .getByLabel("Mô tả công việc", { exact: true })
      .fill(data.description);
  }

  async navigate() {
    await this.page.goto("/jobs");
    await expect(
      this.page.getByRole("heading", {
        name: "Vị trí đang tuyển",
        level: 2,
      }),
    ).toBeVisible();
  }

  async createJob(
    title: string,
    department: string,
    location: string,
    description: string,
  ) {
    await this.page
      .getByRole("button", { name: "Tạo tin mới", exact: true })
      .click();
    const dialog = this.page.getByRole("dialog", {
      name: "Tạo tin tuyển dụng mới",
    });
    await expect(dialog).toBeVisible();
    await this.fillJobDialog(dialog, {
      title,
      department,
      location,
      description,
    });
    await dialog
      .getByRole("button", { name: "Đăng tuyển", exact: true })
      .click();
    await expect(dialog).toBeHidden();
  }

  async editJob(currentTitle: string, data: JobFormData) {
    const jobCard = this.jobArticle(currentTitle);
    await jobCard
      .getByRole("button", {
        name: `Chỉnh sửa tin ${currentTitle}`,
        exact: true,
      })
      .click();
    const dialog = this.page.getByRole("dialog", {
      name: "Cập nhật tin tuyển dụng",
    });
    await expect(dialog).toBeVisible();
    await this.fillJobDialog(dialog, data);
    await dialog
      .getByRole("button", { name: "Lưu thay đổi", exact: true })
      .click();
    await expect(dialog).toBeHidden();
  }

  async verifyJobExists(title: string) {
    await expect(
      this.page.getByRole("heading", { name: title, level: 3, exact: true }),
    ).toBeVisible({ timeout: 5000 });
  }

  async verifyEditButtonVisible(title: string) {
    await expect(
      this.jobArticle(title).getByRole("button", {
        name: `Chỉnh sửa tin ${title}`,
        exact: true,
      }),
    ).toBeVisible();
  }

  async deleteJob(title: string) {
    const deleteButton = this.jobArticle(title).getByRole("button", {
      name: `Xóa tin ${title}`,
      exact: true,
    });

    this.page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    await deleteButton.click();
  }

  async verifyDeleteButtonVisible(title: string, visible: boolean) {
    const deleteButton = this.jobArticle(title).getByRole("button", {
      name: `Xóa tin ${title}`,
      exact: true,
    });
    if (visible) {
      await expect(deleteButton).toBeVisible();
    } else {
      await expect(deleteButton).toHaveCount(0);
    }
  }

  async findFirstJobTitle(namePattern: RegExp) {
    await expect(
      this.page.getByRole("heading", {
        name: "Vị trí đang tuyển",
        level: 2,
      }),
    ).toBeVisible();
    const heading = this.page
      .getByRole("heading", { name: namePattern, level: 3 })
      .first();
    if ((await heading.count()) === 0) return null;
    return heading.innerText();
  }

  async verifyJobRemoved(title: string) {
    await expect(
      this.page.getByRole("heading", { name: title, level: 3, exact: true }),
    ).toHaveCount(0, { timeout: 5000 });
  }
}
