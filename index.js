import dotenv from 'dotenv'
import he from 'he'
import fs from 'fs'
import Handlebars from 'handlebars'
import OpenAI from 'openai'
import express from 'express'

dotenv.config()

// The SDK uses the OPENAI_API_KEY environment variable by default
const openai = new OpenAI();
const app = express();

app.get('/generate/:org/:repo/:prID', async (req, res) => {
    const { org, repo, prID } = req.params
    const githubUrl = `https://api.github.com/repos/${org}/${repo}/pulls/${prID}`

    try {
        // Fetch relevant data about the pull request from the GitHub API
        const prRes  = await get(githubUrl)
        const pullRequest = await prRes.json()

        const diffRes    = await get(pullRequest.diff_url)
        const commitsRes = await get(pullRequest.commits_url)

        const diffs   = await diffRes.text()
        const commits = await commitsRes.json()

        const content = buildPrompt(
            pullRequest.title,
            diffs,
            JSON.stringify(commits),
        )

        const chatCompletion = await openai.chat.completions.create({
            messages: [{ role: 'user', content }],
            model: 'gpt-4',
            temperature: 0.2,
        })

        res.send(chatCompletion.choices[0].message.content);
    } catch (error) {
        console.error('Error generating changelog:', error.message || error)
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));

async function get(url) {
    const res = await fetch(url, {
        headers: {
            'Authorization': `token ${process.env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'ChangelogGPT',
        }
    })

    return res
}

function buildPrompt(title, diffs, commits) {
    const file = fs.readFileSync("prompt.md", "ascii")
    const template = Handlebars.compile(file)
    const data = { title, diffs, commits }

    // Since Handlebars escapes its output by default, we need to decode the HTML entities
    return he.decode(template(data))
}
