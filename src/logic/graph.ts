import ForceGraph3D, { type ForceGraph3DInstance } from "3d-force-graph";
import type { NodeObject, LinkObject } from "three-forcegraph";
import { interpolateRdYlGn } from "d3";
import { Vector2 } from "three";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import type { OrbitControls } from "three/examples/jsm/Addons.js";

import {
  generateNodeData,
  generateNodes,
  generateLinks,
  type NodeData,
} from "./generator";
import { config } from "./config";

type Graph = ForceGraph3DInstance<NodeObject, LinkObject<NodeObject>>;

export function createGraph(element: HTMLElement): Graph {
  const graph = new ForceGraph3D(element, { controlType: "orbit" })
    .enableNodeDrag(false)
    .showNavInfo(false)
    .nodeRelSize(8)
    .backgroundColor(config.utilities.backgroundColor);

  applyColorScale(graph);

  if (config.utilities.bloomFilter) {
    setupBloomEffect(graph);
  }

  return graph;
}

export function generateGraphData(graph: Graph): Array<NodeData> {
  let data = generateNodeData(config.network.n_agents);

  graph.graphData({
    nodes: generateNodes(config.network.n_agents, data),
    links: generateLinks(config.network.n_agents, config.network.n_neighbors),
  });

  return data;
}

export function applyColorScale(graph: Graph): void {
  graph.nodeColor((node) =>
    interpolateRdYlGn((node as { data: NodeData }).data.sentiment),
  );
}

export function toggleOrbitControls(graph: Graph, state: boolean = true): void {
  (graph.controls() as OrbitControls).autoRotate = state;
}

function setupBloomEffect(graph: Graph): void {
  const bloomPass = new UnrealBloomPass(
    new Vector2(window.innerWidth, window.innerHeight),
    4, // strength
    1, // radius
    0, // threshold
  );

  graph.postProcessingComposer().addPass(bloomPass);
}
