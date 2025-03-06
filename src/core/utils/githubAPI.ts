import { Octokit } from "octokit";
import axios from "axios";

const octokit = new Octokit({ });

export const getHistoryOrChangelogFilesRawInformation = async (repo: string, repoOwner: string): Promise<string | null> => {
  const changelogFilesNames = ['CHANGELOG.md', 'changelog.md', 'HISTORY.md', 'history.md'];
  const { data } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
    owner: repoOwner,
    repo,
    path: ''
  })

  const changelog: { download_url: string } = data.find((x: { name: string; }) => changelogFilesNames.includes(x.name));

  if (!changelog) {
    return null;
  }

  const { data: rawChangelogData } = await axios.get(changelog.download_url);
  return rawChangelogData;
}