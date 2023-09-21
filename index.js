const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const BASE_URL = 'https://api.github.com';
const TOKEN = process.env.GITHUB_TOKEN;

async function getPrInfo(owner, repo, prNumber) {
  const response = await axios.get(`${BASE_URL}/repos/${owner}/${repo}/pulls/${prNumber}`, {
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  return response.data;
}

function generateChangelog(prInfo) {
  const mergedAt = new Date(prInfo.merged_at).toISOString().split('T')[0];
  const title = prInfo.title;
  const user = prInfo.user.login;
  const changelog = `## [${mergedAt}] - ${title}\n### Merged by\n- ${user}\n`;
  return changelog;
}

async function main() {
  const owner = 'OWNER'; // Replace with repository owner
  const repo = 'REPO'; // Replace with repository name
  const prNumber = 1; // Replace with PR number
  const prInfo = await getPrInfo(owner, repo, prNumber);
  const changelog = generateChangelog(prInfo);
  console.log(changelog);
}

main();
