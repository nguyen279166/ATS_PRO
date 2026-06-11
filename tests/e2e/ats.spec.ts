import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { SidebarComponent } from "./pages/SidebarComponent";
import { JobsPage } from "./pages/JobsPage";
import { CandidatesPage } from "./pages/CandidatesPage";

test.describe("ATS System End-to-End & Role-Based Access Control Tests", () => {
  const TEST_JOB_TITLE = "E2E Automated Tester Job " + Date.now();

  test("Admin workflow: Login, Create Job, Verify Admin Roles & Export Buttons", async ({ page }) => {
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
    await sidebar.clickMenu("Jobs");
    await page.waitForURL("**/jobs");
    await jobsPage.createJob(
      TEST_JOB_TITLE,
      "Engineering QA",
      "Hà Nội (Hybrid)",
      "This is a test job created automatically by Playwright E2E suite."
    );

    // 4. Verify job appears in the listing
    await jobsPage.verifyJobExists(TEST_JOB_TITLE);

    // 5. Navigate to Candidates Page and verify Export buttons (Excel, PDF) are visible
    await sidebar.clickMenu("Candidates");
    await page.waitForURL("**/candidates");
    await candidatesPage.verifyExportVisible(true);

    // 6. Logout
    await sidebar.logout();
    await page.waitForURL("**/login");
  });

  test("HR workflow: Login, Verify HR Role, Hidden Export & Delete restrictions", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const sidebar = new SidebarComponent(page);
    const candidatesPage = new CandidatesPage(page);

    // 1. Login as HR
    await loginPage.navigate();
    await loginPage.login("nguyen2791661@gmail.com", "Password123");

    // 2. Verify sidebar role
    await sidebar.verifyRole("hr");

    // 3. Navigate to Candidates Page and verify Export buttons (Excel, PDF) are hidden
    await sidebar.clickMenu("Candidates");
    await page.waitForURL("**/candidates");
    await candidatesPage.verifyExportVisible(false);

    // 4. Navigate to Jobs Page and verify Delete job action is restricted (not visible)
    await sidebar.clickMenu("Jobs");
    await page.waitForURL("**/jobs");
    // Verify any job card does not show delete button for HR
    // We look for a delete button on job cards and assert it's absent
    const deleteBtn = page.locator('button[title="Xóa (chỉ Admin)"]').first();
    await expect(deleteBtn).not.toBeVisible();

    // 5. Logout
    await sidebar.logout();
    await page.waitForURL("**/login");
  });

  test("Admin clean up: Login and delete the created job", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const sidebar = new SidebarComponent(page);
    const jobsPage = new JobsPage(page);

    // 1. Login as Admin
    await loginPage.navigate();
    await loginPage.login("admin@ats.com", "Password123");

    // 2. Navigate to Jobs page
    await sidebar.clickMenu("Jobs");
    await page.waitForURL("**/jobs");

    // 3. We'll search for any test job cards and clean them up
    const testJobTitlePattern = "E2E Automated Tester Job";
    const jobCard = page
      .locator(`.sahara-card:has(h3:has-text("${testJobTitlePattern}"))`)
      .first();
    
    if (await jobCard.isVisible()) {
      const jobTitle = await jobCard.locator("h3").innerText();
      await jobsPage.deleteJob(jobTitle);
      
      // Verify job card is gone
      await expect(page.locator(`h3:has-text("${jobTitle}")`)).not.toBeVisible({ timeout: 5000 });
    }

    // 4. Logout
    await sidebar.logout();
  });
});
