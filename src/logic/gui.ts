// src/logic/guiSetup.ts
import { Pane } from "tweakpane";
import * as TweakpaneEssentialsPlugin from "@tweakpane/plugin-essentials";
import { config } from "./config";

export function createGUI(controls: Array<Function>): Pane {
  const gui = new Pane({
    title: "Configuration",
    expanded: true,
  });
  gui.registerPlugin(TweakpaneEssentialsPlugin);

  setupNetworkFolder(gui, controls);
  setupModelFolder(gui);
  setupControlsFolder(gui, controls);

  return gui;
}

function setupNetworkFolder(gui: Pane, controls: Array<Function>): void {
  const networkFolder = gui.addFolder({
    title: `Network (Random Neighbors)`,
    expanded: true,
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

  networkFolder.on("change", (_) => {
    controls[2]();
  });
}

function setupModelFolder(gui: Pane): void {
  const modelFolder = gui.addFolder({
    title: "Model (Deffuant-Weisbuch BCM)",
    expanded: true,
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

function setupControlsFolder(gui: Pane, controls: Array<Function>): void {
  const controlFolder = gui.addFolder({
    title: "Controls",
    expanded: true,
  });

  (
    controlFolder.addBlade({
      view: "buttongrid",
      size: [3, 1],
      cells: (x: number) => ({
        title: ["Start", "Pause", "Reset"][x],
      }),
    }) as any
  ).on("click", (ev: any) => {
    controls[ev.index[0]]();
  });

  controlFolder.addBinding(config.state, "current_step", {
    label: "Progress",
    readonly: true,
    format: (v) => ((v / config.model.n_steps) * 100).toFixed(2),
  });

  controlFolder.addBinding(config.state, "current_evaluation", {
    label: "Evaluation",
    readonly: true,
    view: "graph",
    min: 0,
    max: +1,
  });
}
