var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/cli/index.ts
import dotenv from "dotenv";
import { program } from "commander";

// src/core/scanner.ts
import fs2 from "fs";
import path2 from "path";
import axios4 from "axios";
import semver2 from "semver";
import chalk from "chalk";

// src/core/checkTypeSupport.ts
import fs from "fs";
import path from "path";
import axios from "axios";
function checkTypeSupport(dep) {
  return __async(this, null, function* () {
    const packageJsonPath = path.join("node_modules", dep, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      if (packageJson.types || packageJson.typings) {
        return true;
      }
    }
    try {
      const response = yield axios.get(`https://registry.npmjs.org/@types/${dep}`);
      if (response.status === 200) {
        return false;
      }
    } catch (error) {
      return null;
    }
    return null;
  });
}

// src/core/detectBreakingChanges.ts
import axios3 from "axios";
import semver from "semver";

// src/core/utils/githubAPI.ts
import { Octokit } from "octokit";
import axios2 from "axios";
var octokit = new Octokit({});
var getHistoryOrChangelogFilesRawInformation = (repo, repoOwner) => __async(void 0, null, function* () {
  const changelogFilesNames = ["CHANGELOG.md", "changelog.md", "HISTORY.md", "history.md"];
  const { data } = yield octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
    owner: repoOwner,
    repo,
    path: ""
  });
  const changelog = data.find((x) => changelogFilesNames.includes(x.name));
  if (!changelog) {
    return null;
  }
  const { data: rawChangelogData } = yield axios2.get(changelog.download_url);
  return rawChangelogData;
});

// src/core/analyzeChangelogWithGPT4.ts
import OpenAI from "openai";
function analyzeChangelogWithGPT4(changelog, version) {
  return __async(this, null, function* () {
    const openai = new OpenAI({
      baseURL: "http://localhost:11434/v1",
      apiKey: "ollama"
    });
    const prompt = `
  Eres un experto en an\xE1lisis de cambios en librer\xEDas de software.
  Analiza el siguiente changelog y determina si actualizar desde la versi\xF3n "${version}"
  a cualquier versi\xF3n m\xE1s nueva implicar\xEDa breaking changes.
  
  Instrucciones:
  \u2022 El changelog sigue un formato en el que cada versi\xF3n est\xE1 indicada como un t\xEDtulo (por ejemplo, ## 2.6.0) y debajo de cada versi\xF3n se listan los cambios correspondientes.
  \u2022 Los cambios pueden estar categorizados expl\xEDcitamente con etiquetas como feature, fix, breaking change, siguiendo convenciones como Conventional Commits.
  \u2022 En otros casos, los breaking changes pueden estar indicados dentro del texto con t\xE9rminos como:
  \u2022 \u201Cbreaking change\u201D, "BREAKING CHANGE" \u201Cbreaking\u201D, \u201Cremoval\u201D, \u201Cdeprecated and removed\u201D, \u201Cmajor change\u201D, \u201Cincompatible\u201D, \u201Crequires migration\u201D, \u201Cnot backward compatible\u201D, o cualquier otra frase que sugiera p\xE9rdida de compatibilidad.
  \u2022 Si despu\xE9s de la versi\xF3n "${version}" hay al menos un cambio que pueda romper compatibilidad, responde con:
  \u2022 \u201CS\xED\u201D si hay breaking changes.
  \u2022 \u201CNo\u201D si no hay breaking changes.
  \u2022 \u201CNo estoy seguro\u201D si la informaci\xF3n no es clara o no se puede determinar con certeza.

  Solo responde Si, No, No estoy seguro.

  Changelog:
  "${changelog}"
  `;
    try {
      const response = yield openai.chat.completions.create({
        model: "deepseek-r1:7b",
        messages: [{ role: "user", content: prompt }]
      });
      const result = response.choices[0].message.content.trim().toLowerCase();
      if (result.includes("s\xED")) return true;
      if (result.includes("no estoy seguro")) return false;
      return null;
    } catch (error) {
      console.error("\u274C Error communicating with OpenAI:", error);
      return null;
    }
  });
}

// src/core/utils/removeTextBelowKeyword.ts
function removeTextBelowKeyword(text, keyword) {
  const index = text.indexOf(keyword);
  if (index === -1) return text;
  return text.substring(0, index).trim();
}

// src/core/detectBreakingChanges.ts
function getGithubOwnerAndRepo(repoUrl) {
  try {
    const url = new URL(repoUrl.replace(/\.git$/, ""));
    const parts = url.pathname.split("/").filter(Boolean);
    return {
      owner: parts.length > 1 ? parts[0] : null,
      repo: parts.length > 1 ? parts[1] : null
    };
  } catch (error) {
    console.error("\u274C not valid URL", repoUrl);
    return { owner: null, repo: null };
  }
}
function getGithubRepo(dep) {
  return __async(this, null, function* () {
    try {
      const npmInfo = yield axios3.get(`https://registry.npmjs.org/${dep}`);
      const repository = npmInfo.data.repository;
      let repoUrl = repository.url;
      repoUrl = repoUrl.replace("git+", "");
      return repoUrl;
    } catch (error) {
      console.log(`\u274C Could not obtain the repository of ${dep}`);
      return null;
    }
  });
}
function detectBreakingChanges(dep, version, latestVersion) {
  return __async(this, null, function* () {
    let certaintyScore = 0;
    const updateType = semver.diff(version, latestVersion);
    if (updateType === "major") {
      certaintyScore += 40;
    }
    const repoUrl = yield getGithubRepo(dep);
    if (repoUrl) {
      const { repo, owner } = getGithubOwnerAndRepo(repoUrl);
      const response = yield getHistoryOrChangelogFilesRawInformation(repo, owner);
      if (!response) {
        return certaintyScore;
      }
      const content = removeTextBelowKeyword(response, version);
      const aIResult = yield analyzeChangelogWithGPT4(content, version);
      certaintyScore += aIResult === null ? 0 : aIResult ? 60 : 30;
    }
    return certaintyScore;
  });
}

// src/core/scanner.ts
function scanDependencies() {
  return __async(this, null, function* () {
    var _a;
    const packageJsonPath = path2.join(process.cwd(), "package.json");
    if (!fs2.existsSync(packageJsonPath)) {
      console.error(chalk.red("\u274C Package.json not found"));
      process.exit(1);
    }
    const packageJson = JSON.parse(fs2.readFileSync(packageJsonPath, "utf-8"));
    const dependencies = __spreadValues(__spreadValues({}, packageJson.dependencies), packageJson.devDependencies);
    console.log(chalk.blue("\u{1F4E6} Dependency shai analysis...\n"));
    for (const [dep, version] of Object.entries(dependencies)) {
      const cleanVersion = (_a = semver2.minVersion(version)) == null ? void 0 : _a.version;
      const hasTypescriptSupport = yield checkTypeSupport(dep);
      const tsDTString = hasTypescriptSupport === null ? "" : hasTypescriptSupport ? "[TS]" : "[DT]";
      console.log(`\u{1F50D} Checking ${dep} (v${cleanVersion}) ${tsDTString}`);
      if (!cleanVersion) {
        console.error(chalk.yellow(`\u26A0\uFE0F Wrong version ${dep}@${version}`));
        continue;
      }
      try {
        const response = yield axios4.get(`https://registry.npmjs.org/${dep}`);
        const latestVersion = response.data["dist-tags"].latest;
        if (semver2.lt(cleanVersion, latestVersion)) {
          const updateType = semver2.diff(cleanVersion, latestVersion);
          let updateMessage = `\u{1F680} ${dep} has a new version ${updateType}@${latestVersion}`;
          if (updateType === "major") {
            console.log(chalk.red(`${updateMessage} (Possible breaking change) \u{1F622}`));
          } else if (updateType === "minor") {
            console.log(chalk.yellow(updateMessage));
          } else {
            console.log(chalk.green(updateMessage));
          }
          if (dep.startsWith("@types/")) {
            continue;
          }
          const score = yield detectBreakingChanges(dep, cleanVersion, latestVersion);
          if (score === 0) {
            console.log(chalk.green(`\u2705 You can upgrade to the latest version (${latestVersion}) without any problem.`));
          } else if (score > 0 && score < 50) {
            console.log(chalk.yellow("\u26A0\uFE0F Check in the official documentation to be sure"));
          } else {
            console.log(chalk.red(`\u274C The probability of breaking changes is high for latest version (${latestVersion})`));
          }
        } else {
          console.log(chalk.green(`\u2705 Is up to date.`));
        }
      } catch (error) {
        console.error(chalk.red(`\u274C Error: ${dep}, try again or report an issue`));
      }
      console.log("");
    }
  });
}

// src/cli/index.ts
dotenv.config();
program.version("1.0.0").description("CLI para analizar dependencias y detectar breaking changes");
program.command("scan").description("Escanea dependencias y detecta problemas").action(() => __async(void 0, null, function* () {
  yield scanDependencies();
}));
program.parse(process.argv);
