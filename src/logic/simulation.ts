import type Chart from "chart.js/auto";
import type { LinkObject, NodeObject } from "three-forcegraph";

import { config, type SimulationStatus } from "./config";
import { prepareChart, renderChart, updateChartData } from "./chart";
import {
  applyColorScale,
  generateGraphData,
  toggleOrbitControls,
  type Graph,
} from "./graph";
import {
  computeMetrics,
  deffuant_weisbuch_bcm,
  select_neighbor,
  type Metrics,
} from "./model";
import type { NodeData } from "./generator";

// Rendering every agent line gets expensive for large networks: redraw the
// chart only every n-th step once the network exceeds this many agents.
const CHART_AGENTS_PER_FRAME = 150;
const AUTO_LOOP_DELAY_MS = 1500;

type Timer = ReturnType<typeof setTimeout> | null;
type NeighborIndex = Array<Array<number>>;

export interface SimulationSnapshot extends Metrics {
  status: SimulationStatus;
  step: number;
  n_steps: number;
}

export interface SimulationController {
  start: () => void;
  pause: () => void;
  step: () => void;
  reset: () => void;
}

interface SimulationContext {
  chart: Chart;
  graph: Graph;
  onUpdate?: (snapshot: SimulationSnapshot) => void;
}

export function createSimulationController({
  chart,
  graph,
  onUpdate,
}: SimulationContext): SimulationController {
  let data: Array<NodeData> = [];
  let neighborIndex: NeighborIndex = [];
  let metrics: Metrics = { mean: 0, spread: 0, clusters: 0 };
  let timer: Timer = null;

  const clearTimer = (): void => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const setStatus = (status: SimulationStatus): void => {
    config.state.status = status;
    toggleOrbitControls(graph, status === "running");
  };

  const emit = (): void => {
    onUpdate?.({
      ...metrics,
      status: config.state.status,
      step: config.state.current_step,
      n_steps: config.model.n_steps,
    });
  };

  const isComplete = (): boolean =>
    config.state.current_step >= config.model.n_steps;

  const advance = (forceRender: boolean = false): void => {
    metrics = runStep(data, neighborIndex);
    config.state.current_step++;
    config.state.current_evaluation = metrics.mean;

    const renderEvery = Math.ceil(data.length / CHART_AGENTS_PER_FRAME);
    const shouldRender =
      forceRender ||
      isComplete() ||
      config.state.current_step % renderEvery === 0;

    updateChartData(chart, data, metrics.mean, shouldRender);
    applyColorScale(graph);
  };

  const finish = (): void => {
    // keep the final state on screen so the outcome can be inspected
    setStatus("finished");
    renderChart(chart);
    emit();

    if (config.state.auto_loop) {
      timer = setTimeout(() => {
        timer = null;
        if (config.state.auto_loop) {
          reset();
          start();
        }
      }, AUTO_LOOP_DELAY_MS);
    }
  };

  const tick = (): void => {
    timer = null;

    if (config.state.status !== "running") {
      return;
    }

    if (isComplete()) {
      finish();
      return;
    }

    advance();
    emit();

    timer = setTimeout(tick, 1000 / config.utilities.speed);
  };

  const start = (): void => {
    if (config.state.status === "running") {
      return;
    }

    clearTimer();

    if (isComplete()) {
      reset();
    }

    setStatus("running");
    emit();
    tick();
  };

  const pause = (): void => {
    clearTimer();

    if (config.state.status === "running") {
      setStatus("paused");
      renderChart(chart);
      emit();
    }
  };

  const step = (): void => {
    pause();

    if (isComplete()) {
      return;
    }

    advance(true);

    if (isComplete()) {
      setStatus("finished");
    } else {
      setStatus("paused");
    }
    emit();
  };

  const reset = (): void => {
    clearTimer();

    data = generateGraphData(graph);
    neighborIndex = buildNeighborIndex(graph.graphData().links, data.length);
    metrics = computeMetrics(data.map((node) => node.sentiment));

    config.state.current_step = 0;
    config.state.current_evaluation = metrics.mean;

    setStatus("idle");
    prepareChart(chart, data, metrics.mean);
    applyColorScale(graph);
    emit();
  };

  return {
    start,
    pause,
    step,
    reset,
  };
}

// One synchronous round: every agent interacts with one selected neighbor,
// based on the sentiments at the beginning of the step. The result therefore
// does not depend on the order in which the agents are visited.
function runStep(data: Array<NodeData>, neighborIndex: NeighborIndex): Metrics {
  const { sorting, eps_bcm, delta_bcm } = config.model;
  const current = Float64Array.from(data, (node) => node.sentiment);

  for (let i = 0; i < data.length; i++) {
    const neighbor = select_neighbor(
      current[i],
      neighborIndex[i],
      current,
      sorting,
    );

    data[i].sentiment = deffuant_weisbuch_bcm(
      current[i],
      neighbor,
      eps_bcm,
      delta_bcm,
    );
  }

  return computeMetrics(data.map((node) => node.sentiment));
}

function buildNeighborIndex(
  links: LinkObject<NodeObject>[],
  nodeCount: number,
): NeighborIndex {
  const neighbors: NeighborIndex = Array.from({ length: nodeCount }, () => []);

  for (let i = 0; i < links.length; i++) {
    const sourceId = getNodeId(links[i].source);
    const targetId = getNodeId(links[i].target);

    if (sourceId === null || targetId === null || !neighbors[sourceId]) {
      continue;
    }

    neighbors[sourceId].push(targetId);
  }

  return neighbors;
}

function getNodeId(
  node: number | string | NodeObject | undefined,
): number | null {
  const id = node !== null && typeof node === "object" ? node.id : node;

  if (typeof id === "number") {
    return id;
  }

  if (typeof id === "string") {
    const parsed = Number(id);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}
