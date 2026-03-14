import type Chart from "chart.js/auto";
import type { LinkObject, NodeObject } from "three-forcegraph";

import { config } from "./config";
import { prepareChart, updateChartData } from "./chart";
import {
  applyColorScale,
  generateGraphData,
  toggleOrbitControls,
  type Graph,
} from "./graph";
import { deffuant_weibach_bcm } from "./model";
import type { NodeData } from "./generator";

const TICK_INTERVAL_MS = 50;
const VISUAL_UPDATE_EVERY_STEPS = 1;

type Runner = ReturnType<typeof setInterval> | null;
type NeighborIndex = Array<Array<number>>;

interface SimulationController {
  start: () => void;
  pause: () => void;
  reset: () => void;
}

interface SimulationContext {
  chart: Chart;
  graph: Graph;
}

export function createSimulationController({
  chart,
  graph,
}: SimulationContext): SimulationController {
  let data: Array<NodeData> = [];
  let neighborIndex: NeighborIndex = [];
  let runner: Runner = null;

  const clearRunner = (): void => {
    if (!runner) {
      return;
    }

    clearInterval(runner);
    runner = null;
  };

  const start = (): void => {
    if (config.state.running) {
      return;
    }

    console.debug("> Starting Simulation.");
    config.state.running = true;
    toggleOrbitControls(graph);

    runner = setInterval(() => {
      if (!config.state.running) {
        clearRunner();
        return;
      }

      if (config.state.current_step >= config.model.n_steps) {
        clearRunner();

        if (config.state.auto_loop) {
          reset();
          start();
        } else {
          reset();
        }

        return;
      }

      runStep(data, neighborIndex);
      config.state.current_step++;

      const shouldRender =
        config.state.current_step % VISUAL_UPDATE_EVERY_STEPS === 0;
      updateChartData(chart, data, shouldRender);

      if (shouldRender) {
        applyColorScale(graph);
      }
    }, TICK_INTERVAL_MS);
  };

  const pause = (): void => {
    if (!config.state.running) {
      return;
    }

    console.debug("> Pause Simulation.");
    config.state.running = false;
    toggleOrbitControls(graph, false);
    clearRunner();
  };

  const reset = (): void => {
    console.debug("> Resetting Simulation.");

    if (config.state.running) {
      pause();
    }

    data = generateGraphData(graph);
    neighborIndex = buildNeighborIndex(graph.graphData().links, data.length);

    config.state.current_step = 0;
    config.state.current_evaluation = computeEvaluation(data);

    prepareChart(chart, data);
    applyColorScale(graph);
  };

  return {
    start,
    pause,
    reset,
  };
}

function runStep(data: Array<NodeData>, neighborIndex: NeighborIndex): void {
  let sentimentSum = 0;

  for (let i = 0; i < data.length; i++) {
    const currentSentiment = data[i].sentiment;
    const neighborSentiment = selectNeighborSentiment(
      currentSentiment,
      neighborIndex[i],
      data,
      config.model.sorting,
    );

    data[i].sentiment = deffuant_weibach_bcm(
      currentSentiment,
      neighborSentiment,
    );
    sentimentSum += data[i].sentiment;
  }

  config.state.current_evaluation = sentimentSum / data.length;
}

function selectNeighborSentiment(
  sentiment: number,
  neighbors: Array<number>,
  data: Array<NodeData>,
  sorting: string,
): number {
  if (neighbors.length === 0) {
    return sentiment;
  }

  switch (sorting) {
    case "random": {
      const randomIndex = Math.floor(Math.random() * neighbors.length);
      return data[neighbors[randomIndex]].sentiment;
    }
    case "positivity": {
      let maxSentiment = Number.NEGATIVE_INFINITY;
      for (let i = 0; i < neighbors.length; i++) {
        const candidate = data[neighbors[i]].sentiment;
        if (candidate > maxSentiment) {
          maxSentiment = candidate;
        }
      }
      return maxSentiment;
    }
    case "negativity": {
      let minSentiment = Number.POSITIVE_INFINITY;
      for (let i = 0; i < neighbors.length; i++) {
        const candidate = data[neighbors[i]].sentiment;
        if (candidate < minSentiment) {
          minSentiment = candidate;
        }
      }
      return minSentiment;
    }
    case "similarity": {
      let closestSentiment = data[neighbors[0]].sentiment;
      let closestDistance = Math.abs(closestSentiment - sentiment);

      for (let i = 1; i < neighbors.length; i++) {
        const candidate = data[neighbors[i]].sentiment;
        const distance = Math.abs(candidate - sentiment);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestSentiment = candidate;
        }
      }

      return closestSentiment;
    }
    default:
      return sentiment;
  }
}

function buildNeighborIndex(
  links: LinkObject<NodeObject>[],
  nodeCount: number,
): NeighborIndex {
  const neighbors: NeighborIndex = Array.from({ length: nodeCount }, () => []);

  for (let i = 0; i < links.length; i++) {
    const sourceId = getNodeId(links[i].source);
    const targetId = getNodeId(links[i].target);

    if (sourceId === null || targetId === null) {
      continue;
    }

    if (!neighbors[sourceId]) {
      neighbors[sourceId] = [];
    }

    neighbors[sourceId].push(targetId);
  }

  return neighbors;
}

function getNodeId(
  node: number | string | NodeObject | undefined,
): number | null {
  if (typeof node === "number") {
    return node;
  }

  if (typeof node === "string") {
    const parsed = Number(node);
    return Number.isNaN(parsed) ? null : parsed;
  }

  if (node && "id" in node) {
    const nodeId = (node as { id?: number | string }).id;

    if (typeof nodeId === "number") {
      return nodeId;
    }

    if (typeof nodeId === "string") {
      const parsed = Number(nodeId);
      return Number.isNaN(parsed) ? null : parsed;
    }
  }

  return null;
}

function computeEvaluation(data: Array<NodeData>): number {
  if (data.length === 0) {
    return 0;
  }

  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i].sentiment;
  }

  return sum / data.length;
}
