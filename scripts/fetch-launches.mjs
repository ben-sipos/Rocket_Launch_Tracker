import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const outputPath = resolve(projectRoot, "data", "upcoming-launches.json");
const endpoint = "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=12&mode=detailed";

function deriveMissionName(launch) {
  if (launch?.mission?.name) {
    return launch.mission.name;
  }

  if (typeof launch?.name === "string" && launch.name.includes("|")) {
    return launch.name.split("|")[1].trim();
  }

  return launch?.name || "Unnamed mission";
}

function simplifyLaunch(launch) {
  return {
    id: launch.id,
    missionName: deriveMissionName(launch),
    rocket: launch?.rocket?.configuration?.full_name || launch?.rocket?.configuration?.name || "Rocket TBD",
    provider: launch?.launch_service_provider?.name || "Provider TBD",
    launchSite: launch?.pad?.location?.name || "Launch site TBD",
    pad: launch?.pad?.name || "Pad TBD",
    status: launch?.status?.name || "Status TBD",
    net: launch?.net || null,
    windowStart: launch?.window_start || null,
    windowEnd: launch?.window_end || null,
    missionType: launch?.mission?.type || "Mission type TBD",
    description: launch?.mission?.description || "",
    mapUrl: launch?.pad?.map_url || null
  };
}

async function main() {
  const response = await fetch(endpoint, {
    headers: {
      "User-Agent": "launch-tracker-dashboard/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Launch API request failed with ${response.status}`);
  }

  const payload = await response.json();
  const now = Date.now();
  const launches = (payload.results || [])
    .filter((launch) => {
      const timestamp = Date.parse(launch.net);
      return Number.isFinite(timestamp) && timestamp >= now;
    })
    .sort((a, b) => Date.parse(a.net) - Date.parse(b.net))
    .map(simplifyLaunch);

  const output = {
    generatedAt: new Date().toISOString(),
    source: endpoint,
    total: launches.length,
    launches
  };

  await mkdir(resolve(projectRoot, "data"), { recursive: true });
  await writeFile(outputPath, JSON.stringify(output, null, 2) + "\n", "utf8");

  console.log(`Wrote ${launches.length} upcoming launches to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
