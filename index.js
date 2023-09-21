import dotenv from 'dotenv'
import he from 'he'
import fs from 'fs'
import Handlebars from 'handlebars'
import OpenAI from 'openai'

dotenv.config()

const GITHUB_TOKEN   = process.env.GITHUB_TOKEN
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const openai = new OpenAI();

// Replace with your desired repository and PR ID
const repo = 'EOX-A/EOxElements'
const prID = '186'

const githubUrl = `https://api.github.com/repos/${repo}/pulls/${prID}`
const openaiUrl = 'https://api.openai.com/v1/engines/gpt-3.5-turbo/completions'

const generateChangelog = async () => {
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
            model: 'gpt-3.5-turbo',
            temperature: 0.3,
        })
        //const changelog = chatCompletion.choices && chatCompletion.choices[0] && chatCompletion.choices[0].text.trim()

        console.log(chatCompletion.choices[0].message.content)
    } catch (error) {
        console.error('Error generating changelog:', error.message || error)
    }
}

async function get(url) {
    const res = await fetch(url, {
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
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


// Run the generateChangelog function
generateChangelog()
