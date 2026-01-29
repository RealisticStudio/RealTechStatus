import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-analytics.js";

// --- Configuration ---
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBcn9rLNa-Vlh-1hjglujek7X4V3iUacVQ",
    authDomain: "realtech-jp01.firebaseapp.com",
    projectId: "realtech-jp01",
    storageBucket: "realtech-jp01.firebasestorage.app",
    messagingSenderId: "719802782357",
    appId: "1:719802782357:web:5d47db1f1803795af6c19c",
    measurementId: "G-M26YZHZBPV"
};

const SERVICES = [
    {
        id: 'cwa-earthquake',
        name: '顯著有感地震報告',
        url: 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/E-A0015-001?Authorization=CWA-19B695DB-613E-496B-A962-8A9399FD36A3',
        type: 'api',
        safeUrl: 'opendata.cwa.gov.tw/api/.../E-A0015-001'
    },
    {
        id: 'cwa-stations',
        name: '臺灣天氣測站資料',
        url: 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001?Authorization=CWA-19B695DB-613E-496B-A962-8A9399FD36A3',
        type: 'api',
        safeUrl: 'opendata.cwa.gov.tw/api/.../O-A0001-001'
    },
    {
        id: 'cwa-weather',
        name: '天氣預報',
        // Using generic station data endpoint to match "station data"
        url: 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0003-001?Authorization=CWA-19B695DB-613E-496B-A962-8A9399FD36A3',
        type: 'api',
        safeUrl: 'opendata.cwa.gov.tw/api/.../O-A0003-001'
    },
    {
        id: 'exptech-intensity',
        name: 'ExpTech 震度速報',
        url: 'https://api-1.exptech.dev/api/v2/trem/intensity',
        type: 'api',
        safeUrl: 'api-1.exptech.dev/.../intensity'
    },
    {
        id: 'exptech-rts',
        name: 'ExpTech RTS',
        url: 'https://lb-1.exptech.dev/api/v2/trem/rts',
        type: 'api',
        safeUrl: 'lb-1.exptech.dev/.../rts'
    },
    {
        id: 'exptech-eew',
        name: 'ExpTech 緊急地震速報',
        url: 'https://lb-1.exptech.dev/api/v2/eq/eew',
        type: 'api',
        safeUrl: 'lb-1.exptech.dev/.../eew'
    },
    {
        id: 'wolfx-eew',
        name: 'Wolfx - 中央氣象署緊急地震速報',
        url: 'https://api.wolfx.jp/cwa_eew.json',
        type: 'api',
        safeUrl: 'api.wolfx.jp/cwa_eew.json'
    },
    {
        id: 'firebase-sg',
        name: 'RealTech Firebase - 新加坡',
        url: 'https://realtech-jp01-default-rtdb.asia-southeast1.firebasedatabase.app/.json',
        type: 'firebase',
        safeUrl: 'realtech-jp01...firebasedatabase.app'
    }
];

const UPDATE_INTERVAL = 10 * 1000; // 10 seconds
const MAX_HISTORY = 20;

// Store chart instances and data history
const charts = {};
const history = {};

// --- Initialization ---
async function init() {
    // Init Firebase (just to verify SDK loads and app created)
    try {
        const app = initializeApp(FIREBASE_CONFIG);
        const analytics = getAnalytics(app);
        console.log("Firebase Initialized", app);
    } catch (e) {
        console.error("Firebase Init Error", e);
    }

    const container = document.getElementById('dashboard');

    // Create Cards
    SERVICES.forEach(service => {
        const card = createCardHTML(service);
        container.appendChild(card);

        // Init History
        history[service.id] = [];

        // Init Chart
        const ctx = document.getElementById(`chart-${service.id}`).getContext('2d');
        charts[service.id] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Latency (ms)',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#94a3b8',
                        bodyColor: '#f1f5f9',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: { display: false },
                    y: {
                        display: true,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#64748b', font: { size: 10 } }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    });

    // Initial Check
    checkAllStatus();

    // Start Loop
    setInterval(checkAllStatus, UPDATE_INTERVAL);
}

// --- HTML Generators ---
function createCardHTML(service) {
    const div = document.createElement('div');
    div.className = 'status-card';
    div.id = `card-${service.id}`;
    div.innerHTML = `
        <div class="card-header">
            <div class="service-info">
                <div class="service-name">${service.name}</div>
                <a href="${service.url}" target="_blank" class="service-url">${service.safeUrl}</a>
            </div>
            <div class="status-indicator" id="status-${service.id}">
                <div class="status-dot"></div>
                <span class="status-text">Checking...</span>
            </div>
        </div>
        
        <div class="metrics-container">
            <div class="metric">
                <div class="metric-label">Status</div>
                <div class="metric-value" id="val-status-${service.id}">-</div>
            </div>
            <div class="metric">
                <div class="metric-label">Latency</div>
                <div class="metric-value" id="val-ping-${service.id}">- ms</div>
            </div>
        </div>

        <div class="chart-container">
            <canvas id="chart-${service.id}"></canvas>
            <div class="chart-loading" id="loading-${service.id}">Waiting for data...</div>
        </div>
        
        <div class="last-updated" id="updated-${service.id}">Never</div>
    `;
    return div;
}

// --- Logic ---
async function checkAllStatus() {
    console.log("Starting Status Check...");
    const now = new Date();

    const results = await Promise.all(SERVICES.map(service => updateServiceStatus(service, now)));

    // results is array of booleans (isOnline)
    const allOperational = results.every(isOnline => isOnline);
    // If we want slightly more detail (e.g. at least one is failing)

    const badge = document.getElementById('global-status');
    const badgeText = document.getElementById('global-status-text');

    if (!badge || !badgeText) return;

    badge.className = 'status-badge'; // Reset to base class

    if (allOperational) {
        badgeText.textContent = 'Systems Operational';
        // No extra class for green (default)
    } else {
        // If any service is down, show warning (yellow) as requested
        badge.classList.add('warning');
        badgeText.textContent = 'Service Disruption';
    }
}

async function updateServiceStatus(service, timeObj) {
    const card = document.getElementById(`card-${service.id}`);
    const statusIndicator = document.getElementById(`status-${service.id}`);
    const statusText = statusIndicator.querySelector('.status-text');
    const valStatus = document.getElementById(`val-status-${service.id}`);
    const valPing = document.getElementById(`val-ping-${service.id}`);
    const loading = document.getElementById(`loading-${service.id}`);
    const updated = document.getElementById(`updated-${service.id}`);

    if (loading) loading.style.display = 'none';

    let latency = 0;
    let isOnline = false;
    let statusMsg = "Unknown";

    const start = performance.now();
    try {
        // Perform Ping
        // For CWA, we fetch. For Firebase, we fetch the hosting URL.
        const response = await fetch(service.url, {
            method: 'GET',
            cache: 'no-cache',
            // Try to avoid CORS issues if simple GET fails, though Opendata usually ok.
            // If CORS fails, we might just get a network error but can't distinguish 404 from CORS easily in JS without proxy.
            // Assuming direct access is allowed for these open data APIs.
        });

        const end = performance.now();
        latency = Math.round(end - start);

        if (response.ok || (response.type === 'opaque')) {
            isOnline = true;
            statusMsg = response.statusText || "OK 200";
            if (response.status === 200) statusMsg = "Active";
        } else {
            isOnline = false;
            statusMsg = `Error ${response.status}`;
        }

    } catch (e) {
        console.warn(`Check failed for ${service.id}`, e);
        isOnline = false;
        statusMsg = "Connection Failed";
        latency = 0; // Or high value?
    }

    // Update UI
    statusIndicator.className = `status-indicator ${isOnline ? 'online' : 'offline'}`;
    statusText.textContent = isOnline ? 'Operational' : 'Down';

    valStatus.textContent = isOnline ? "ONLINE" : "OFFLINE";
    valStatus.style.color = isOnline ? "var(--accent-success)" : "var(--accent-error)";

    valPing.textContent = isOnline ? `${latency} ms` : "N/A";
    updated.textContent = `Updated: ${timeObj.toLocaleTimeString()}`;

    // Update Chart
    updateChart(service.id, timeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isOnline ? latency : null);

    return isOnline;
}

function updateChart(serviceId, label, value) {
    const chart = charts[serviceId];
    if (!chart) return;

    const data = chart.data;

    // Add new data
    data.labels.push(label);
    data.datasets[0].data.push(value);

    // Remove old data if limit reached
    if (data.labels.length > MAX_HISTORY) {
        data.labels.shift();
        data.datasets[0].data.shift();
    }

    // Dynamic Color for high latency
    if (value > 1000) {
        data.datasets[0].borderColor = '#ef4444'; // Red
    } else if (value > 500) {
        data.datasets[0].borderColor = '#f59e0b'; // Yellow
    } else {
        data.datasets[0].borderColor = '#3b82f6'; // Blue
    }

    chart.update();
}

// Start
init();
