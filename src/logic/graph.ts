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

export type Graph = ForceGraph3DInstance<NodeObject, LinkObject<NodeObject>>;

type AgentNode = NodeObject & { data: NodeData };

let bloomPass: UnrealBloomPass | null = null;

export function createGraph(element: HTMLElement): Graph {
  const graph = new ForceGraph3D(element, { controlType: "orbit" })
    .enableNodeDrag(false)
    .showNavInfo(false)
    .nodeRelSize(8)
    .nodeLabel(
      (node) =>
        `Agent ${node.id} · sentiment ${(node as AgentNode).data.sentiment.toFixed(2)}`,
    )
    .linkDirectionalArrowLength(4)
    .linkDirectionalArrowRelPos(1)
    .backgroundColor(config.utilities.backgroundColor);

  applyColorScale(graph);
  setBloomEffect(graph, config.utilities.bloomFilter);

  addEventListener("resize", () => {
    graph.width(window.innerWidth);
    graph.height(window.innerHeight);
  });

  return graph;
}

export function generateGraphData(graph: Graph): Array<NodeData> {
  let data = generateNodeData(config.network.n_agents);

  applyLayoutForces(graph, config.network.n_neighbors);

  graph.graphData({
    nodes: generateNodes(config.network.n_agents, data),
    links: generateLinks(config.network.n_agents, config.network.n_neighbors),
  });

  return data;
}

// d3-force defaults; they give a readable layout up to BASE_NEIGHBORS links
// per node. Beyond that the extra links pull the network into a dense ball,
// so links get longer and nodes repel each other harder.
const BASE_NEIGHBORS = 2;
const BASE_LINK_DISTANCE = 30;
const BASE_CHARGE_STRENGTH = -30;

type LinkForce = { distance(value: number): unknown };
type ChargeForce = { strength(value: number): unknown };

export function applyLayoutForces(graph: Graph, numNeighbors: number): void {
  const spread = Math.max(1, numNeighbors / BASE_NEIGHBORS);

  (graph.d3Force("link") as unknown as LinkForce | undefined)?.distance(
    BASE_LINK_DISTANCE * spread,
  );
  (graph.d3Force("charge") as unknown as ChargeForce | undefined)?.strength(
    BASE_CHARGE_STRENGTH * spread ** 1.5,
  );
}

export function applyColorScale(graph: Graph): void {
  graph.nodeColor((node) =>
    interpolateRdYlGn((node as AgentNode).data.sentiment),
  );
}

export function toggleOrbitControls(graph: Graph, state: boolean = true): void {
  (graph.controls() as OrbitControls).autoRotate = state;
}

export function setBloomEffect(graph: Graph, enabled: boolean): void {
  const composer = graph.postProcessingComposer();

  if (enabled && !bloomPass) {
    bloomPass = new UnrealBloomPass(
      new Vector2(window.innerWidth, window.innerHeight),
      4, // strength
      1, // radius
      0, // threshold
    );
    composer.addPass(bloomPass);
  } else if (!enabled && bloomPass) {
    composer.removePass(bloomPass);
    bloomPass.dispose();
    bloomPass = null;
  }
}
