export type SimulationStatus = "idle" | "running" | "paused" | "finished";

export type Sorting = "random" | "similarity" | "positivity" | "negativity";

export let config = {
  network: {
    n_agents: 150,
    n_neighbors: 2,
  },
  model: {
    sorting: "random" as Sorting,
    n_steps: 500,
    eps_bcm: 0.2,
    delta_bcm: 0.1,
  },
  utilities: {
    bloomFilter: true,
    backgroundColor: "#000",
    speed: 20, // simulation steps per second
  },
  state: {
    status: "idle" as SimulationStatus,
    auto_loop: false,
    current_step: 0,
    current_evaluation: 0.0,
  },
};

// --- --- ---
// Session state: parameters survive page reloads and the round trip to the
// introduction page. Nothing leaves the browser.

const STORAGE_KEY = "twony-macro:config";
const PERSISTED_SECTIONS = ["network", "model", "utilities"] as const;

export function loadConfig(): void {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    const stored = JSON.parse(raw);

    for (const section of PERSISTED_SECTIONS) {
      const target = config[section] as Record<string, unknown>;
      const source = stored?.[section];

      if (!source || typeof source !== "object") {
        continue;
      }

      for (const key of Object.keys(target)) {
        if (typeof source[key] === typeof target[key]) {
          target[key] = source[key];
        }
      }
    }
  } catch {
    // storage unavailable or corrupted: keep the defaults
  }
}

export function saveConfig(): void {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        network: config.network,
        model: config.model,
        utilities: config.utilities,
      }),
    );
  } catch {
    // storage unavailable: parameters simply do not persist
  }
}
