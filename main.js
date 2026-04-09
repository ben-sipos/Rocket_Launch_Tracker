const DATA_URL = "./data/upcoming-launches.json";

const nextLaunchName = document.querySelector("#next-launch-name");
const launchCount = document.querySelector("#launch-count");
const lastUpdated = document.querySelector("#last-updated");
const countdownSummary = document.querySelector("#countdown-summary");
const featuredLaunch = document.querySelector("#featured-launch");
const tableBody = document.querySelector("#launch-table-body");
const refreshButton = document.querySelector("#refresh-button");

const countdownEls = {
  days: document.querySelector("#days"),
  hours: document.querySelector("#hours"),
  minutes: document.querySelector("#minutes"),
  seconds: document.querySelector("#seconds")
};

let countdownTimer = null;
let dashboardState = {
  launches: [],
  generatedAt: null
};

function formatDateTime(value) {
  if (!value) {
    return "TBD";
  }

  const date = new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  }).format(date);
}

function formatRelativeUpdate(value) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function getStatusClass(status) {
  const normalized = (status || "").toLowerCase();

  if (normalized.includes("hold") || normalized.includes("delay") || normalized.includes("tbd")) {
    return "status-hold";
  }

  if (normalized.includes("failure") || normalized.includes("cancel")) {
    return "status-danger";
  }

  return "status-go";
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function updateCountdown(nextLaunch) {
  if (countdownTimer) {
    window.clearInterval(countdownTimer);
  }

  if (!nextLaunch || !nextLaunch.net) {
    countdownSummary.textContent = "No future launch time is available in the current dataset.";
    Object.values(countdownEls).forEach((el) => {
      el.textContent = "--";
    });
    return;
  }

  const tick = () => {
    const target = new Date(nextLaunch.net).getTime();
    const delta = target - Date.now();

    if (delta <= 0) {
      countdownSummary.textContent = `${nextLaunch.missionName} is at or past liftoff. Reload data for the latest schedule.`;
      Object.values(countdownEls).forEach((el) => {
        el.textContent = "00";
      });
      return;
    }

    const days = Math.floor(delta / 86400000);
    const hours = Math.floor((delta % 86400000) / 3600000);
    const minutes = Math.floor((delta % 3600000) / 60000);
    const seconds = Math.floor((delta % 60000) / 1000);

    countdownEls.days.textContent = pad(days);
    countdownEls.hours.textContent = pad(hours);
    countdownEls.minutes.textContent = pad(minutes);
    countdownEls.seconds.textContent = pad(seconds);

    countdownSummary.textContent = `${nextLaunch.missionName} on ${nextLaunch.rocket} from ${nextLaunch.launchSite}.`;
  };

  tick();
  countdownTimer = window.setInterval(tick, 1000);
}

function renderFeaturedLaunch(nextLaunch) {
  if (!nextLaunch) {
    featuredLaunch.innerHTML = '<p class="empty-state">No upcoming launches found in the current feed.</p>';
    nextLaunchName.textContent = "No launch scheduled";
    return;
  }

  nextLaunchName.textContent = nextLaunch.missionName;
  featuredLaunch.innerHTML = `
    <article class="featured-card">
      <div class="featured-copy">
        <span class="mission-pill">${nextLaunch.provider || "Launch provider TBD"}</span>
        <h3 class="featured-mission">${nextLaunch.missionName}</h3>
        <p class="launch-site">${nextLaunch.description || "Mission details were not included in the latest feed."}</p>
      </div>
      <div class="featured-grid">
        <article class="detail-card">
          <p class="meta-label">Launch Date</p>
          <p class="detail-value">${formatDateTime(nextLaunch.net)}</p>
        </article>
        <article class="detail-card">
          <p class="meta-label">Rocket</p>
          <p class="detail-value">${nextLaunch.rocket}</p>
        </article>
        <article class="detail-card">
          <p class="meta-label">Launch Site</p>
          <p class="detail-value">${nextLaunch.launchSite}</p>
        </article>
        <article class="detail-card">
          <p class="meta-label">Status</p>
          <p class="detail-value">${nextLaunch.status}</p>
        </article>
      </div>
    </article>
  `;
}

function renderLaunchTable(launches) {
  if (!launches.length) {
    tableBody.innerHTML = '<tr><td colspan="5" class="loading-row">No upcoming launches are available right now.</td></tr>';
    return;
  }

  tableBody.innerHTML = launches.map((launch) => `
    <tr>
      <td>
        <strong>${formatDateTime(launch.net)}</strong>
        <span class="timestamp-subtext">${launch.windowStart ? `Window opens ${formatDateTime(launch.windowStart)}` : "Precise window not provided"}</span>
      </td>
      <td>
        <strong>${launch.missionName}</strong>
        <span class="mission-subtext">${launch.provider || "Provider TBD"}</span>
      </td>
      <td>
        <strong>${launch.rocket}</strong>
        <span class="mission-subtext">${launch.missionType || "Mission type TBD"}</span>
      </td>
      <td>
        <strong>${launch.launchSite}</strong>
        <span class="mission-subtext">${launch.pad || "Pad TBD"}</span>
      </td>
      <td>
        <span class="status-chip ${getStatusClass(launch.status)}">${launch.status}</span>
      </td>
    </tr>
  `).join("");
}

function pickNextLaunch(launches) {
  const now = Date.now();
  return launches.find((launch) => {
    const timestamp = Date.parse(launch.net);
    return Number.isFinite(timestamp) && timestamp > now;
  }) || launches[0] || null;
}

async function loadLaunches({ bustCache = false } = {}) {
  try {
    tableBody.innerHTML = '<tr><td colspan="5" class="loading-row">Refreshing launch schedule...</td></tr>';
    refreshButton.disabled = true;

    const cacheSuffix = bustCache ? `?t=${Date.now()}` : "";
    const response = await fetch(`${DATA_URL}${cacheSuffix}`, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Launch feed request failed with ${response.status}`);
    }

    const payload = await response.json();
    const launches = Array.isArray(payload.launches) ? payload.launches : [];

    dashboardState = {
      generatedAt: payload.generatedAt,
      launches
    };

    launchCount.textContent = String(launches.length);
    lastUpdated.textContent = formatRelativeUpdate(payload.generatedAt);

    const nextLaunch = pickNextLaunch(launches);
    renderFeaturedLaunch(nextLaunch);
    renderLaunchTable(launches);
    updateCountdown(nextLaunch);
  } catch (error) {
    console.error(error);
    nextLaunchName.textContent = "Feed unavailable";
    launchCount.textContent = "--";
    lastUpdated.textContent = "--";
    featuredLaunch.innerHTML = `
      <p class="empty-state">
        The local launch feed could not be loaded. If you are previewing from the filesystem, use a local server or GitHub Pages instead.
      </p>
    `;
    tableBody.innerHTML = '<tr><td colspan="5" class="loading-row">Unable to load launch data.</td></tr>';
    updateCountdown(null);
  } finally {
    refreshButton.disabled = false;
  }
}

refreshButton.addEventListener("click", () => {
  loadLaunches({ bustCache: true });
});

loadLaunches();
