import type { CanvasEdge, CanvasNode, NodeShape } from "@/types/canvas";
import { NODE_COLORS } from "@/types/canvas";

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

interface TemplateNodeInput {
  id: string;
  label: string;
  x: number;
  y: number;
  shape?: NodeShape;
  colorIndex?: number;
  width?: number;
  height?: number;
}

function node({
  id,
  label,
  x,
  y,
  shape = "rectangle",
  colorIndex = 0,
  width = 160,
  height = 72,
}: TemplateNodeInput): CanvasNode {
  return {
    id,
    type: "canvasNode",
    position: { x, y },
    width,
    height,
    data: {
      label,
      shape,
      color: NODE_COLORS[colorIndex]?.fill ?? NODE_COLORS[0].fill,
    },
  };
}

function edge(
  id: string,
  source: string,
  target: string,
  label = "",
): CanvasEdge {
  return {
    id,
    source,
    target,
    type: "canvasEdge",
    data: { label },
  };
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices-commerce",
    name: "Microservices Commerce",
    description:
      "API gateway, independent services, shared platform services, and dedicated service data stores.",
    nodes: [
      node({
        id: "ms-client",
        label: "Web / Mobile Client",
        x: -420,
        y: 20,
        shape: "hexagon",
        colorIndex: 7,
      }),
      node({
        id: "ms-gateway",
        label: "API Gateway",
        x: -170,
        y: 20,
        shape: "pill",
        colorIndex: 1,
      }),
      node({
        id: "ms-auth",
        label: "Auth Service",
        x: 80,
        y: -130,
        shape: "pill",
        colorIndex: 2,
      }),
      node({
        id: "ms-catalog",
        label: "Catalog Service",
        x: 80,
        y: 20,
        shape: "pill",
        colorIndex: 6,
      }),
      node({
        id: "ms-orders",
        label: "Order Service",
        x: 80,
        y: 170,
        shape: "pill",
        colorIndex: 3,
      }),
      node({
        id: "ms-db",
        label: "Service Databases",
        x: 350,
        y: 20,
        shape: "cylinder",
        colorIndex: 0,
      }),
    ],
    edges: [
      edge("ms-e-client-gateway", "ms-client", "ms-gateway"),
      edge("ms-e-gateway-auth", "ms-gateway", "ms-auth"),
      edge("ms-e-gateway-catalog", "ms-gateway", "ms-catalog"),
      edge("ms-e-gateway-orders", "ms-gateway", "ms-orders"),
      edge("ms-e-auth-db", "ms-auth", "ms-db"),
      edge("ms-e-catalog-db", "ms-catalog", "ms-db"),
      edge("ms-e-orders-db", "ms-orders", "ms-db"),
    ],
  },
  {
    id: "ci-cd-pipeline",
    name: "CI/CD Pipeline",
    description:
      "Source control through build, test, artifact publishing, deployment, and production monitoring.",
    nodes: [
      node({
        id: "cicd-repo",
        label: "Git Repository",
        x: -500,
        y: 20,
        shape: "hexagon",
        colorIndex: 1,
      }),
      node({
        id: "cicd-build",
        label: "Build",
        x: -260,
        y: 20,
        shape: "rectangle",
        colorIndex: 2,
      }),
      node({
        id: "cicd-test",
        label: "Automated Tests",
        x: -20,
        y: 20,
        shape: "diamond",
        colorIndex: 3,
        width: 130,
        height: 100,
      }),
      node({
        id: "cicd-registry",
        label: "Artifact Registry",
        x: 220,
        y: 20,
        shape: "cylinder",
        colorIndex: 6,
      }),
      node({
        id: "cicd-deploy",
        label: "Deploy",
        x: 460,
        y: 20,
        shape: "pill",
        colorIndex: 7,
      }),
      node({
        id: "cicd-monitor",
        label: "Monitoring",
        x: 460,
        y: 170,
        shape: "circle",
        colorIndex: 4,
        width: 110,
        height: 110,
      }),
    ],
    edges: [
      edge("cicd-e-repo-build", "cicd-repo", "cicd-build"),
      edge("cicd-e-build-test", "cicd-build", "cicd-test"),
      edge("cicd-e-test-registry", "cicd-test", "cicd-registry", "pass"),
      edge("cicd-e-registry-deploy", "cicd-registry", "cicd-deploy"),
      edge("cicd-e-deploy-monitor", "cicd-deploy", "cicd-monitor"),
    ],
  },
  {
    id: "event-driven-orders",
    name: "Event-Driven Orders",
    description:
      "Order intake publishes domain events consumed by payment, inventory, fulfillment, and notifications.",
    nodes: [
      node({
        id: "eda-client",
        label: "Client App",
        x: -440,
        y: 40,
        shape: "hexagon",
        colorIndex: 7,
      }),
      node({
        id: "eda-orders",
        label: "Order API",
        x: -190,
        y: 40,
        shape: "pill",
        colorIndex: 1,
      }),
      node({
        id: "eda-bus",
        label: "Event Bus",
        x: 60,
        y: 40,
        shape: "circle",
        colorIndex: 2,
        width: 120,
        height: 120,
      }),
      node({
        id: "eda-payment",
        label: "Payment Worker",
        x: 320,
        y: -130,
        shape: "rectangle",
        colorIndex: 3,
      }),
      node({
        id: "eda-inventory",
        label: "Inventory Worker",
        x: 320,
        y: 40,
        shape: "rectangle",
        colorIndex: 6,
      }),
      node({
        id: "eda-notify",
        label: "Notification Worker",
        x: 320,
        y: 210,
        shape: "rectangle",
        colorIndex: 5,
      }),
      node({
        id: "eda-store",
        label: "Event Store",
        x: 60,
        y: 230,
        shape: "cylinder",
        colorIndex: 0,
      }),
    ],
    edges: [
      edge("eda-e-client-orders", "eda-client", "eda-orders"),
      edge("eda-e-orders-bus", "eda-orders", "eda-bus", "publish"),
      edge("eda-e-bus-payment", "eda-bus", "eda-payment"),
      edge("eda-e-bus-inventory", "eda-bus", "eda-inventory"),
      edge("eda-e-bus-notify", "eda-bus", "eda-notify"),
      edge("eda-e-bus-store", "eda-bus", "eda-store"),
    ],
  },
];
