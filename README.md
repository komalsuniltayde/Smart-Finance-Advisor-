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
