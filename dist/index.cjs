"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
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
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
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
var import_dotenv = __toESM(require("dotenv"), 1);
var import_commander = require("commander");

// src/core/scanner.ts
var import_fs2 = __toESM(require("fs"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_axios4 = __toESM(require("axios"), 1);
var import_semver2 = __toESM(require("semver"), 1);
var import_chalk = __toESM(require("chalk"), 1);

// src/core/checkTypeSupport.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_axios = __toESM(require("axios"), 1);
function checkTypeSupport(dep) {
  return __async(this, null, function* () {
    const packageJsonPath = import_path.default.join("node_modules", dep, "package.json");
    if (import_fs.default.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(import_fs.default.readFileSync(packageJsonPath, "utf-8"));
      if (packageJson.types || packageJson.typings) {
        return true;
      }
    }
    try {
      const response = yield import_axios.default.get(`https://registry.npmjs.org/@types/${dep}`);
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
var import_axios3 = __toESM(require("axios"), 1);
var import_semver = __toESM(require("semver"), 1);

// src/core/utils/githubAPI.ts
var import_octokit = require("octokit");
var import_axios2 = __toESM(require("axios"), 1);
var octokit = new import_octokit.Octokit({});
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
  const { data: rawChangelogData } = yield import_axios2.default.get(changelog.download_url);
  return rawChangelogData;
});

// src/core/analyzeChangelogWithGPT4.ts
var import_openai = __toESM(require("openai"), 1);
function analyzeChangelogWithGPT4(changelog, version) {
  return __async(this, null, function* () {
    const openai = new import_openai.default({
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
      const npmInfo = yield import_axios3.default.get(`https://registry.npmjs.org/${dep}`);
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
    const updateType = import_semver.default.diff(version, latestVersion);
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
    const packageJsonPath = import_path2.default.join(process.cwd(), "package.json");
    if (!import_fs2.default.existsSync(packageJsonPath)) {
      console.error(import_chalk.default.red("\u274C Package.json not found"));
      process.exit(1);
    }
    const packageJson = JSON.parse(import_fs2.default.readFileSync(packageJsonPath, "utf-8"));
    const dependencies = __spreadValues(__spreadValues({}, packageJson.dependencies), packageJson.devDependencies);
    console.log(import_chalk.default.blue("\u{1F4E6} Dependency shai analysis...\n"));
    for (const [dep, version] of Object.entries(dependencies)) {
      const cleanVersion = (_a = import_semver2.default.minVersion(version)) == null ? void 0 : _a.version;
      const hasTypescriptSupport = yield checkTypeSupport(dep);
      const tsDTString = hasTypescriptSupport === null ? "" : hasTypescriptSupport ? "[TS]" : "[DT]";
      console.log(`\u{1F50D} Checking ${dep} (v${cleanVersion}) ${tsDTString}`);
      if (!cleanVersion) {
        console.error(import_chalk.default.yellow(`\u26A0\uFE0F Wrong version ${dep}@${version}`));
        continue;
      }
      try {
        const response = yield import_axios4.default.get(`https://registry.npmjs.org/${dep}`);
        const latestVersion = response.data["dist-tags"].latest;
        if (import_semver2.default.lt(cleanVersion, latestVersion)) {
          const updateType = import_semver2.default.diff(cleanVersion, latestVersion);
          let updateMessage = `\u{1F680} ${dep} has a new version ${updateType}@${latestVersion}`;
          if (updateType === "major") {
            console.log(import_chalk.default.red(`${updateMessage} (Possible breaking change) \u{1F622}`));
          } else if (updateType === "minor") {
            console.log(import_chalk.default.yellow(updateMessage));
          } else {
            console.log(import_chalk.default.green(updateMessage));
          }
          if (dep.startsWith("@types/")) {
            continue;
          }
          const score = yield detectBreakingChanges(dep, cleanVersion, latestVersion);
          if (score === 0) {
            console.log(import_chalk.default.green(`\u2705 You can upgrade to the latest version (${latestVersion}) without any problem.`));
          } else if (score > 0 && score < 50) {
            console.log(import_chalk.default.yellow("\u26A0\uFE0F Check in the official documentation to be sure"));
          } else {
            console.log(import_chalk.default.red(`\u274C The probability of breaking changes is high for latest version (${latestVersion})`));
          }
        } else {
          console.log(import_chalk.default.green(`\u2705 Is up to date.`));
        }
      } catch (error) {
        console.error(import_chalk.default.red(`\u274C Error: ${dep}, try again or report an issue`));
      }
      console.log("");
    }
  });
}

// src/cli/index.ts
import_dotenv.default.config();
import_commander.program.version("1.0.0").description("CLI para analizar dependencias y detectar breaking changes");
import_commander.program.command("scan").description("Escanea dependencias y detecta problemas").action(() => __async(void 0, null, function* () {
  yield scanDependencies();
}));
import_commander.program.parse(process.argv);
