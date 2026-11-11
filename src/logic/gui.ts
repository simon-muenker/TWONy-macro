import { Pane } from "tweakpane";
import * as TweakpaneEssentialsPlugin from "@tweakpane/plugin-essentials";

import { config, saveConfig } from "./config";
import { setBloomEffect, type Graph } from "./graph";
import type { SimulationController } from "./simulation";

function shouldExpandByDefault(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 768px)").matches
  );
}

export function createGUI(
  simulation: SimulationController,
  graph: Graph,
  introductionUrl: string,
): Pane {
  const expanded = shouldExpandByDefault();
  const gui = new Pane({
    title: "Configuration",
    expanded,
  });
  gui.registerPlugin(TweakpaneEssentialsPlugin);

  setupInstructionsButton(gui, introductionUrl);
  setupNetworkFolder(gui, simulation, expanded);
  setupModelFolder(gui, expanded);
  setupControlsFolder(gui, simulation, expanded);
  setupAppearanceFolder(gui, graph);

  gui.on("change", () => saveConfig());

  return gui;
}

function setupInstructionsButton(gui: Pane, introductionUrl: string): void {
  gui
    .addButton({
      title: "read introduction",
    })
    .on("click", () => {
      window.location.href = introductionUrl;
    });
}

function setupNetworkFolder(
  gui: Pane,
  simulation: SimulationController,
  expanded: boolean,
): void {
  const networkFolder = gui.addFolder({
    title: `Network (Random Regular Graph)`,
    expanded,
  });

  networkFolder.addBinding(config.network, "n_agents", {
    label: "Num._Agents",
    min: 5,
    max: 500,
    step: 5,
  });

  networkFolder.addBinding(config.network, "n_neighbors", {
    label: "Num._Neighbors",
    min: 1,
    max: 5,
    step: 1,
  });

  // regenerate the network once the slider is released, not on every drag event
  networkFolder.on("change", (ev) => {
    if (!ev.last) {
      return;
    }

    const wasRunning = config.state.status === "running";
    simulation.reset();
    if (wasRunning) {
      simulation.start();
    }
  });
}

function setupModelFolder(gui: Pane, expanded: boolean): void {
  const modelFolder = gui.addFolder({
    title: "Model (Deffuant-Weisbuch BCM)",
    expanded,
  });

  modelFolder.addBinding(config.model, "sorting", {
    label: "Sorting",
    options: {
      random: "random",
      similarity: "similarity",
      positivity: "positivity",
      negativity: "negativity",
    },
  });

  modelFolder.addBinding(config.model, "n_steps", {
    label: "Num._Steps",
    min: 50,
    max: 1000,
    step: 50,
  });

  modelFolder.addBinding(config.model, "eps_bcm", {
    label: "Epsilon_BCM",
    min: 0.01,
    max: 1.0,
    step: 0.01,
  });

  modelFolder.addBinding(config.model, "delta_bcm", {
    label: "Delta_BCM",
    min: 0.01,
    max: 1.0,
    step: 0.01,
  });
}

function setupControlsFolder(
  gui: Pane,
  simulation: SimulationController,
  expanded: boolean,
): void {
  const controlFolder = gui.addFolder({
    title: "Controls",
    expanded,
  });

  const actions = [
    { title: "Start", run: simulation.start },
    { title: "Pause", run: simulation.pause },
    { title: "Step", run: simulation.step },
    { title: "Reset", run: simulation.reset },
  ];

  (
    controlFolder.addBlade({
      view: "buttongrid",
      size: [2, 2],
      cells: (x: number, y: number) => ({
        title: actions[y * 2 + x].title,
      }),
    }) as any
  ).on("click", (ev: any) => {
    actions[ev.index[1] * 2 + ev.index[0]].run();
  });

  controlFolder.addBinding(config.utilities, "speed", {
    label: "Speed",
    min: 1,
    max: 60,
    step: 1,
  });

  controlFolder.addBinding(config.state, "auto_loop", {
    label: "Auto Loop",
  });
}

function setupAppearanceFolder(gui: Pane, graph: Graph): void {
  const appearanceFolder = gui.addFolder({
    title: "Appearance",
    expanded: true,
  });

  appearanceFolder
    .addBinding(config.utilities, "bloomFilter", {
      label: "Bloom Effect",
    })
    .on("change", (ev) => {
      setBloomEffect(graph, ev.value);
    });
}
