import fs from "fs";
import path from "path";
import axios from "axios";
import semver from "semver";
import chalk from "chalk";
import {checkTypeSupport} from "./checkTypeSupport";
import {detectBreakingChanges} from "./detectBreakingChanges";

export async function scanDependencies() {
  const packageJsonPath = path.join(process.cwd(), "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    console.error(chalk.red("❌ Package.json not found"));
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

  console.log(chalk.blue("📦 Dependency shai analysis...\n"));

  for (const [dep, version] of Object.entries(dependencies as Record<string, string>)) {
    const cleanVersion = semver.minVersion(version)?.version;
    const hasTypescriptSupport = await checkTypeSupport(dep);

    const tsDTString = hasTypescriptSupport === null ? '' : hasTypescriptSupport ? '[TS]' : '[DT]'
    console.log(`🔍 Checking ${dep} (v${cleanVersion}) ${tsDTString}`);

    if (!cleanVersion) {
      console.error(chalk.yellow(`⚠️ Wrong version ${dep}@${version}`));
      continue;
    }

    try {
      const response = await axios.get(`https://registry.npmjs.org/${dep}`);
      const latestVersion = response.data["dist-tags"].latest;

      if (semver.lt(cleanVersion, latestVersion)) {
        const updateType = semver.diff(cleanVersion, latestVersion);
        let updateMessage = `🚀 ${dep} has a new version ${updateType}@${latestVersion}`;

        if (updateType === "major") {
          console.log(chalk.red(`${updateMessage} (Possible breaking change) 😢`));
        } else if (updateType === "minor") {
          console.log(chalk.yellow(updateMessage));
        } else {
          console.log(chalk.green(updateMessage));
        }

        if (dep.startsWith("@types/")) {
          continue;
        }


        const score = await detectBreakingChanges(dep, cleanVersion, latestVersion);
        if (score === 0) {
          console.log(chalk.green(`✅ You can upgrade to the latest version (${latestVersion}) without any problem.`))
        } else if (score > 0 && score < 50) {
          console.log(chalk.yellow('⚠️ Check in the official documentation to be sure'))
        } else {
          console.log(chalk.red(`❌ The probability of breaking changes is high for latest version (${latestVersion})`))
        }
      } else {
        console.log(chalk.green(`✅ Is up to date.`));
      }
    } catch (error) {
      console.error(chalk.red(`❌ Error: ${dep}, try again or report an issue`));
    }

    console.log("");
  }
}