import { test } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage.ts";
import { SidebarComponent } from "./pages/SidebarComponent.ts";
import { JobsPage } from "./pages/JobsPage.ts";
import { CandidatesPage } from "./pages/CandidatesPage.ts";

test.describe("ATS System End-to-End & Role-Based Access Control Tests", () => {
  const TEST_JOB_TITLE = "E2E Automated Tester Job " + Date.now();
  const HR_TEST_EMAIL = `e2e.hr.${Date.now()}@ats.test`;
  const HR_TEST_PASSWORD = "Password123";
  const API_BASE_URL = process.env.VITE_BASE_URL || "http://localhost:3001";

  test("Admin: đăng nhập, tạo tin và thấy quyền xuất báo cáo", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const sidebar = new SidebarComponent(page);
    const jobsPage = new JobsPage(page);
    const candidatesPage = new CandidatesPage(page);

    // 1. Login as Admin
    await loginPage.navigate();
    await loginPage.login("admin@ats.com", "Password123");

    // 2. Verify sidebar role
    await sidebar.verifyRole("admin");

    // 3. Navigate to Jobs Page and create a test job
    await sidebar.clickMenu("Tin tuyển dụng");
    await page.waitForURL("**/jobs");
    await jobsPage.createJob(
      TEST_JOB_TITLE,
      "Engineering QA",
      "Hà Nội (Hybrid)",
      "Tin tuyển dụng kiểm thử được tạo tự động bởi Playwright.",
    );

    // 4. Verify job appears in the listing
    await jobsPage.verifyJobExists(TEST_JOB_TITLE);
    await jobsPage.verifyEditButtonVisible(TEST_JOB_TITLE);
    await jobsPage.verifyDeleteButtonVisible(TEST_JOB_TITLE, true);

    // 5. Navigate to Candidates Page and verify Export buttons (Excel, PDF) are visible
    await sidebar.clickMenu("Ứng viên");
    await page.waitForURL("**/candidates");
    await candidatesPage.verifyExportVisible(true);

    // 6. Logout
    await sidebar.logout();
    await page.waitForURL("**/login");
  });

  test("HR: ẩn quyền xuất báo cáo và xóa tin", async ({ page, request }) => {
    const loginPage = new LoginPage(page);
    const sidebar = new SidebarComponent(page);
    const candidatesPage = new CandidatesPage(page);
    const jobsPage = new JobsPage(page);

    await request.post(`${API_BASE_URL}/api/auth/register`, {
      data: {
        fullName: "E2E HR User",
        email: HR_TEST_EMAIL,
        password: HR_TEST_PASSWORD,
        // The API must ignore attempts to self-assign Admin during public signup.
        role: "admin",
      },
    });

    // 1. Login as HR
    await loginPage.navigate();
    await loginPage.login(HR_TEST_EMAIL, HR_TEST_PASSWORD);

    // 2. Verify sidebar role
    await sidebar.verifyRole("hr");

    // 3. Navigate to Candidates Page and verify Export buttons (Excel, PDF) are hidden
    await sidebar.clickMenu("Ứng viên");
    await page.waitForURL("**/candidates");
    await candidatesPage.verifyExportVisible(false);

    // 4. Navigate to Jobs Page and verify Delete job action is restricted (not visible)
    await sidebar.clickMenu("Tin tuyển dụng");
    await page.waitForURL("**/jobs");
    await jobsPage.verifyJobExists(TEST_JOB_TITLE);
    await jobsPage.verifyDeleteButtonVisible(TEST_JOB_TITLE, false);

    // 5. Logout
    await sidebar.logout();
    await page.waitForURL("**/login");
  });

  test("Admin: dọn tin kiểm thử đã tạo", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const sidebar = new SidebarComponent(page);
    const jobsPage = new JobsPage(page);

    // 1. Login as Admin
    await loginPage.navigate();
    await loginPage.login("admin@ats.com", "Password123");

    // 2. Navigate to Jobs page
    await sidebar.clickMenu("Tin tuyển dụng");
    await page.waitForURL("**/jobs");

    // 3. We'll search for any test job cards and clean them up
    const jobTitle = await jobsPage.findFirstJobTitle(
      /E2E Automated Tester Job/,
    );

    if (jobTitle) {
      await jobsPage.deleteJob(jobTitle);
      await jobsPage.verifyJobRemoved(jobTitle);
    }

    // 4. Logout
    await sidebar.logout();
  });
});
