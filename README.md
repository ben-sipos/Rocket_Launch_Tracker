# Launch Tracker Dashboard

Static web dashboard for upcoming rocket launches worldwide. It includes:

- Next-launch countdown timer
- Upcoming launch table with date, mission, rocket, launch site, and status
- Public data refresh workflow for GitHub Pages
- No build step required

## Data Source

This project uses The Space Devs Launch Library 2 API:

- Docs: `https://thespacedevs.com/llapi`
- Endpoint used by the refresh script: `https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=12&mode=detailed`

## API Key

You do **not** need an API key for the version currently wired into this dashboard.

The public endpoint supports anonymous access, which is enough for a GitHub Actions refresh job that runs on a schedule. If you later want higher request volume or stronger reliability guarantees, check with The Space Devs for paid API access on their site.

## Local Preview

1. Open PowerShell in this folder.
2. Run `./run-local.ps1`
3. Visit `http://127.0.0.1:8124/`

## GitHub Pages Deployment

1. Create a new GitHub repository using the contents of this folder as the repo root.
2. Push the files to your default branch, usually `main`.
3. In GitHub, open `Settings -> Pages`.
4. Set `Source` to `GitHub Actions`.
5. Run the `Update Launch Data` workflow once manually to seed the latest JSON.
6. Run the `Deploy GitHub Pages` workflow, or just push a commit and let it deploy automatically.

## Scheduled Refresh

The workflow at `.github/workflows/update-launches.yml` refreshes `data/upcoming-launches.json` every 30 minutes and commits it back to the branch.

## Notes

- If the browser shows stale data, use the `Reload Data` button.
- If you open `index.html` directly from disk, browser fetch restrictions may block the JSON request. Use the local server or GitHub Pages.
