# RealTech Status Monitoring

A professional, real-time service status dashboard for RealTech Studio.

## Features
- **Real-time Monitoring**: Checks service status every 5 minutes.
- **Latency Tracking**: Displays current ping and historical latency charts.
- **Visuals**: Modern Glassmorphism UI with Dark Mode.
- **Services Monitored**:
    - CWA Opendata (Forecast)
    - CWA Earthquake Reports
    - Taiwan Weather Stations
    - RealTech Firebase (Osaka)

## How to Run
Because this project uses ES Modules (for Firebase and modular JavaScript) and fetches external APIs, **you must run it on a local web server**. Opening `index.html` directly in the file explorer will likely result in CORS or Module errors.

### Option 1: Using Python (Recommended if installed)
1. Open a terminal in this folder.
2. Run:
   ```powershell
   python -m http.server
   ```
3. Open http://localhost:8000 in your browser.

### Option 2: Using Node.js (npx)
1. Open a terminal in this folder.
2. Run:
   ```powershell
   npx http-server
   ```
3. Open the link provided (usually http://127.0.0.1:8080).

## Configuration
- Modify `main.js` to add more services or change the check interval (default: 5 minutes).
- Styles can be customized in `style.css`.
