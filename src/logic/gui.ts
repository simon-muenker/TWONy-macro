// src/logic/guiSetup.ts
import { GUI } from "dat.gui";
import { CONFIG } from "./config";
// import type { SimulationController } from "./simulation";

export function createGUI(): typeof GUI {
  const gui = new GUI({
    name: "Configuration",
    width: 280,
  });

  setupNetworkFolder(gui);
  setupModelFolder(gui);
  //setupControlsFolder(gui, simulation);

  return gui;
}

function setupNetworkFolder(gui: typeof GUI): void {
  const networkFolder = gui.addFolder("Network");

  networkFolder
    .add(CONFIG.network, "n_agents", 10, 5000, 10)
    .name("Num. Agents")
    .onChange(() => {
      // Trigger network regeneration when changed
      console.log(
        "Network configuration changed - restart simulation to apply",
      );
    });

  networkFolder
    .add(CONFIG.network, "n_neighbors", 1, 50, 1)
    .name("Num. Neighbors")
    .onChange(() => {
      console.log(
        "Network configuration changed - restart simulation to apply",
      );
    });

  networkFolder.open();
}

function setupModelFolder(gui: typeof GUI): void {
  const modelFolder = gui.addFolder("Model");

  modelFolder
    .add(CONFIG.model, "sorting", [
      "random",
      "similarity",
      "positivity",
      "negativity",
    ])
    .name("Sorting");

  modelFolder.add(CONFIG.model, "n_steps", 1, 1000, 1).name("Num. Steps");

  modelFolder.add(CONFIG.model, "eps_bcm", 0.01, 1, 0.01).name("Epsilon BCM");

  modelFolder.add(CONFIG.model, "eps_rei", 0.0, 1, 0.01).name("Epsilon REI");

  modelFolder.add(CONFIG.model, "delta_bcm", 0.01, 1, 0.01).name("Delta BCM");

  modelFolder.open();
}

// function setupControlsFolder(gui: GUI, simulation: SimulationController): void {
//   const controls = {
//     start: () => simulation.start(),
//     pause: () => simulation.pause(),
//     reset: () => simulation.reset(),
//   };

//   gui.add(controls, "start").name("Start");
//   gui.add(controls, "pause").name("Pause");
//   gui.add(controls, "reset").name("Reset");
// }
