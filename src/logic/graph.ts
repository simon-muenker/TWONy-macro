import ForceGraph3D, { type ForceGraph3DInstance } from "3d-force-graph";
import type { NodeObject, LinkObject } from "three-forcegraph";
import { interpolateRdYlGn } from "d3";
import {
  AdditiveBlending,
  CanvasTexture,
  Fog,
  type PerspectiveCamera,
  Sprite,
  SpriteMaterial,
  Vector2,
} from "three";
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

type AgentNode = NodeObject & {
  data: NodeData;
  __threeObj?: { children: Array<unknown> };
};

const NODE_REL_SIZE = 8;

// Reference network: the visual parameters below are tuned for this size and
// get scaled down as the network becomes larger and denser.
const BASE_AGENTS = 150;

// Bloom is a screen-space effect: every lit pixel adds to the glow, so the
// same settings that look good on a sparse network wash a dense one out to a
// white screen. Strength and radius therefore shrink with the network size.
const BLOOM_STRENGTH = 1;
const BLOOM_RADIUS = 0.6;
const BLOOM_THRESHOLD = 0;

const LINK_OPACITY = 0.25;
const MIN_LINK_OPACITY = 0.02;
// links glow as well: dim them while the bloom pass is active
const BLOOM_LINK_DIMMING = 0.5;

// Soft additive sprite behind every node: a cheap glow that is used while the
// bloom pass is switched off (bloom would amplify it a second time).
const HALO_SCALE = NODE_REL_SIZE * 5;
const HALO_OPACITY = 0.55;

// Camera framing: follow the layout while it unfolds, until the user takes over.
const CAMERA_MARGIN = 1.15;
const CAMERA_EASING = 0.08;
const MIN_LAYOUT_RADIUS = 120;

let bloomPass: UnrealBloomPass | null = null;
let haloTexture: CanvasTexture | null = null;
let layoutRadius = MIN_LAYOUT_RADIUS;
let followLayout = true;
let framedNetwork = "";

export function createGraph(element: HTMLElement): Graph {
  const graph = new ForceGraph3D(element, { controlType: "orbit" })
    .enableNodeDrag(false)
    .showNavInfo(false)
    .nodeRelSize(NODE_REL_SIZE)
    .nodeResolution(16)
    .nodeOpacity(0.92)
    .nodeLabel(
      (node) =>
        `Agent ${node.id} · sentiment ${(node as AgentNode).data.sentiment.toFixed(2)}`,
    )
    .nodeThreeObjectExtend(true)
    .nodeThreeObject((node) => createHalo(node as AgentNode))
    .linkColor(() => "#cbd5e1")
    .linkDirectionalArrowLength(4)
    .linkDirectionalArrowRelPos(1)
    .backgroundColor(config.utilities.backgroundColor);

  // depth cue: agents and links at the back of the network fade out
  graph.scene().fog = new Fog(config.utilities.backgroundColor, 1, 5000);

  applyColorScale(graph);
  applyDensityStyle(graph);
  setBloomEffect(graph, config.utilities.bloomFilter);

  const controls = graph.controls() as OrbitControls;
  controls.addEventListener("start", () => (followLayout = false));
  controls.addEventListener("change", () => updateFog(graph));

  graph.onEngineTick(() => frameLayout(graph));
  graph.onEngineStop(() => (followLayout = false));

  addEventListener("resize", () => {
    graph.width(window.innerWidth);
    graph.height(window.innerHeight);
    bloomPass?.setSize(window.innerWidth, window.innerHeight);
  });

  return graph;
}

export function generateGraphData(graph: Graph): Array<NodeData> {
  let data = generateNodeData(config.network.n_agents);

  applyLayoutForces(graph, config.network.n_neighbors);
  applyDensityStyle(graph);

  // re-frame the camera only when the network changes shape, so a plain reset
  // (or the auto loop) keeps the view the user has chosen
  const network = `${config.network.n_agents}/${config.network.n_neighbors}`;
  if (network !== framedNetwork) {
    framedNetwork = network;
    followLayout = true;
  }

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

  for (const node of graph.graphData().nodes as Array<AgentNode>) {
    getHalo(node)?.material.color.set(interpolateRdYlGn(node.data.sentiment));
  }
}

export function toggleOrbitControls(graph: Graph, state: boolean = true): void {
  (graph.controls() as OrbitControls).autoRotate = state;
}

export function setBloomEffect(graph: Graph, enabled: boolean): void {
  const composer = graph.postProcessingComposer();

  if (enabled && !bloomPass) {
    bloomPass = new UnrealBloomPass(
      new Vector2(window.innerWidth, window.innerHeight),
      BLOOM_STRENGTH,
      BLOOM_RADIUS,
      BLOOM_THRESHOLD,
    );
    composer.addPass(bloomPass);
  } else if (!enabled && bloomPass) {
    composer.removePass(bloomPass);
    bloomPass.dispose();
    bloomPass = null;
  }

  applyDensityStyle(graph);
}

// --- --- ---
// Density scaling

// How much more crowded the picture is than the reference network: grows with
// the number of agents and with the number of links each of them adds.
function agentLoad(): number {
  return Math.max(1, config.network.n_agents / BASE_AGENTS);
}

function neighborLoad(): number {
  return Math.max(1, config.network.n_neighbors / BASE_NEIGHBORS);
}

// Scales everything that accumulates on screen (bloom, link and halo opacity)
// with the size of the network. Safe to call at any time.
export function applyDensityStyle(graph: Graph): void {
  const agents = agentLoad();
  const neighbors = neighborLoad();

  graph.linkOpacity(
    Math.max(
      MIN_LINK_OPACITY,
      ((bloomPass ? BLOOM_LINK_DIMMING : 1) * LINK_OPACITY) /
        (neighbors ** 0.7 * agents ** 0.3),
    ),
  );

  if (bloomPass) {
    bloomPass.strength = BLOOM_STRENGTH / (agents ** 0.5 * neighbors ** 0.75);
    bloomPass.radius = BLOOM_RADIUS / (agents ** 0.25 * neighbors ** 0.25);
  }

  const haloOpacity = HALO_OPACITY / (agents ** 0.4 * neighbors ** 0.2);
  for (const node of graph.graphData().nodes as Array<AgentNode>) {
    const halo = getHalo(node);
    if (halo) {
      halo.visible = !bloomPass;
      halo.material.opacity = haloOpacity;
    }
  }
}

// --- --- ---
// Node halos

function getHaloTexture(): CanvasTexture {
  if (!haloTexture) {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;

    const context = canvas.getContext("2d")!;
    const gradient = context.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.35, "rgba(255, 255, 255, 0.45)");
    gradient.addColorStop(0.7, "rgba(255, 255, 255, 0.08)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    haloTexture = new CanvasTexture(canvas);
  }

  return haloTexture;
}

function createHalo(node: AgentNode): Sprite {
  const halo = new Sprite(
    new SpriteMaterial({
      map: getHaloTexture(),
      color: interpolateRdYlGn(node.data.sentiment),
      blending: AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: HALO_OPACITY / (agentLoad() ** 0.4 * neighborLoad() ** 0.2),
    }),
  );
  halo.scale.setScalar(HALO_SCALE);
  halo.visible = !bloomPass;
  // the halo must not swallow the pointer events of the agent it surrounds
  halo.raycast = () => {};

  return halo;
}

function getHalo(node: AgentNode): Sprite | undefined {
  return node.__threeObj?.children.find(
    (child): child is Sprite => child instanceof Sprite,
  );
}

// --- --- ---
// Camera framing and depth fog

// Runs on every layout tick: measures how far the network extends and, until
// the user moves the camera, keeps the whole network in view.
function frameLayout(graph: Graph): void {
  let radius = 0;
  for (const node of graph.graphData().nodes) {
    radius = Math.max(
      radius,
      Math.hypot(node.x ?? 0, node.y ?? 0, node.z ?? 0),
    );
  }
  layoutRadius = Math.max(MIN_LAYOUT_RADIUS, radius);

  if (followLayout) {
    const camera = graph.camera() as PerspectiveCamera;
    const verticalHalfAngle = (camera.fov * Math.PI) / 360;
    const halfAngle = Math.min(
      verticalHalfAngle,
      Math.atan(Math.tan(verticalHalfAngle) * camera.aspect),
    );
    const target = (layoutRadius / Math.sin(halfAngle)) * CAMERA_MARGIN;
    const distance = camera.position.length() || target;

    camera.position.setLength(distance + (target - distance) * CAMERA_EASING);
  }

  updateFog(graph);
}

function updateFog(graph: Graph): void {
  const fog = graph.scene().fog;

  if (fog instanceof Fog) {
    const distance = graph.camera().position.length();

    fog.near = Math.max(1, distance - layoutRadius * 0.5);
    fog.far = distance + layoutRadius * 2.5;
  }
}
