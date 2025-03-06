import axios from "axios";
import semver from "semver";
import { getHistoryOrChangelogFilesRawInformation } from "./utils/githubAPI";
import {analyzeChangelogWithGPT4} from "./analyzeChangelogWithGPT4";
import {removeTextBelowKeyword} from "./utils/removeTextBelowKeyword";

function getGithubOwnerAndRepo(repoUrl: string): { owner: string | null; repo: string | null } {
  try {
    const url = new URL(repoUrl.replace(/\.git$/, ""));
    const parts = url.pathname.split("/").filter(Boolean);

    return {
      owner: parts.length > 1 ? parts[0] : null,
      repo: parts.length > 1 ? parts[1] : null,
    };
  } catch (error) {
    console.error("❌ not valid URL", repoUrl);
    return { owner: null, repo: null };
  }
}

async function getGithubRepo(dep: string): Promise<string | null> {
  try {
    const npmInfo = await axios.get(`https://registry.npmjs.org/${dep}`);
    const repository = npmInfo.data.repository;
    let repoUrl = repository.url;
    repoUrl = repoUrl.replace("git+", "")

    return repoUrl;
  } catch (error) {
    console.log(`❌ Could not obtain the repository of ${dep}`);
    return null;
  }
}

export async function detectBreakingChanges(dep: string, version: string, latestVersion: string): Promise<number> {
  let certaintyScore = 0;

  const updateType = semver.diff(version, latestVersion);
  if (updateType === "major") {
    certaintyScore += 40;
  }

  const repoUrl = await getGithubRepo(dep);

  if (repoUrl) {
    const { repo, owner } = getGithubOwnerAndRepo(repoUrl);

    const response = await getHistoryOrChangelogFilesRawInformation(repo!, owner!);

    if (!response) {
      return certaintyScore;
    }

    const content = removeTextBelowKeyword(response, version)
    const aIResult = await analyzeChangelogWithGPT4(content, version);
    certaintyScore += aIResult === null ? 0 : aIResult ? 60 : 30;
  }

  return certaintyScore;
}