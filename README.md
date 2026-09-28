# Smart Finance Advisor

React/Vite frontend, Express/MongoDB backend, and Flask forecasting service.

## Run locally

Prerequisites: Node.js, Python 3.11 or later, and a running local MongoDB server.

1. In `smart-finance-advisory`, run `npm ci`.
2. In `smart-finance-backend`, run `npm ci`. Copy `.env.example` to `.env` and set a private JWT secret. Supply your own Gemini API key to enable AI advice. Email credentials are optional.
3. In `smart-finance-ml`, run `python -m venv venv`, then `venv\Scripts\python.exe -m pip install -r requirements.txt`.
4. On Windows, run `run_project.bat` from the project root.
5. Open http://localhost:3000.

The backend runs on port 5000 and the forecasting service on port 8000. Existing accounts depend on your local MongoDB data; the login page's demo credentials require a matching account in your database.

Dependencies, virtual environments, build output, and private `.env` files are excluded from Git.

## Vercel deployment

Use the repository root as the Vercel Root Directory (leave it blank), and deploy `uploaded-project-2026-09-28`. The root `vercel.json` installs and builds the nested Vite app, publishes its `dist` folder, routes `/api/*` to Express, and serves React routes such as `/login` and `/admin` without a 404.

Configure these server-side environment variables in Vercel:

- `MONGODB_URI`: an online MongoDB connection string reachable from Vercel. A localhost connection cannot work in a hosted deployment.
- `JWT_SECRET`: a long random private secret.
- `FLASK_URL`: the HTTPS URL of a separately hosted `smart-finance-ml` Flask service.
- `GEMINI_API_KEY`: your key for AI advice.
- `EMAIL_USER`, `EMAIL_PASS`, and `ADMIN_EMAIL`: optional email settings.

Never prefix these secrets with `VITE_` or commit `.env`. Local database accounts and transactions are not automatically uploaded. `/api/health` checks the API runtime; it does not certify a successful database connection.

The daily in-process email schedule runs only with the local server. Hosted scheduled reminders require a separately configured scheduled job. The frontend can load before the database and forecasting services are configured, but those features require their services.
