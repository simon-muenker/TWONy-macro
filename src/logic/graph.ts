import ForceGraph3D from "3d-force-graph";
import { interpolateRdYlGn } from "d3";
import { Vector2 } from "three";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { generateNodes, generateLinks, type NodeData } from "./generator";
import { CONFIG } from "./config";

export function createGraph(element: HTMLElement, data: NodeData[]) {
  const graph = new ForceGraph3D(element, { controlType: "orbit" })
    .enableNodeDrag(false)
    .showNavInfo(false)
    .nodeRelSize(8)
    .backgroundColor(CONFIG.utilities.backgroundColor)
    .nodeColor((node) => interpolateRdYlGn((node as any).data.sentiment));

  updateGraphData(graph, data);

  if (CONFIG.utilities.bloomFilter) {
    setupBloomEffect(graph);
  }

  return graph;
}

export function updateGraphData(graph: any, data: NodeData[]): void {
  graph.graphData({
    nodes: generateNodes(CONFIG.network.n_agents, data),
    links: generateLinks(CONFIG.network.n_agents, CONFIG.network.n_neighbors),
  });
}

function setupBloomEffect(graph: any): void {
  const bloomPass = new UnrealBloomPass(
    new Vector2(window.innerWidth, window.innerHeight),
    4, // strength
    1, // radius
    0, // threshold
  );

  graph.postProcessingComposer().addPass(bloomPass);
}
