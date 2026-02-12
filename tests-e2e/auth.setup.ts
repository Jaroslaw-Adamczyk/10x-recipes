import { test as setup } from "./fixtures";
import { TEST_USER } from "./test-data";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFile = path.join(__dirname, "../playwright/.auth/user.json");

setup("authenticate", async ({ loginPage, recipesPage }) => {
  await loginPage.goto();
  await loginPage.login(TEST_USER.email, TEST_USER.password);
  await loginPage.waitForRedirect("/");
  await recipesPage.expectToBeOnRecipesPage();

  await recipesPage.page.context().storageState({ path: authFile });
});
