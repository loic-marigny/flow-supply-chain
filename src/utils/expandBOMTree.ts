// src/utils/expandBOMTree.ts
// Expand a BOM tree into React Flow nodes and edges. No deduplication; each
// occurrence becomes its own instance. Non-functional comments cleanup.
import type { Node, Edge } from "reactflow";
import type { ComponentType } from "../types";

type BOMAttributes = {
  unit_cost: number;
  ordering_cost: number;
  carrying_cost: number;
  number_on_hand: number;
  lead_time: number;
  lot_size: number;
};

export type BomNode = {
  component: string;
  componentId?: string;
  attributes: BOMAttributes;
  badge_value?: number;
  children?: BomNode[];
};

type ComponentNodeData = {
  component: ComponentType;
  badge_value?: number;
};

function toComponent(n: BomNode, dossierId?: string): ComponentType {
  return {
    id: n.componentId ?? `ghost-${Math.random().toString(36).slice(2)}`,
    dossierId: dossierId ?? "",
    name: n.component,
    unit_cost: n.attributes.unit_cost ?? 0,
    ordering_cost: n.attributes.ordering_cost ?? 0,
    carrying_cost: n.attributes.carrying_cost ?? 0,
    number_on_hand: n.attributes.number_on_hand ?? 0,
    lead_time: n.attributes.lead_time ?? 1,
    lot_size: n.attributes.lot_size ?? 1,
  };
}

/**
 * Unfold a BOM into React Flow nodes and edges.
 * - NO deduplication: each occurrence becomes its own instance.
 * - Node IDs are based on the path (root, root-0, root-0-1…).
 * - Adds an OFFSET when a position is already occupied to avoid overlap.
 */
export function expandBOMTree(
  bom: BomNode,
  originX: number,
  originY: number,
  dossierId?: string,
  opts?: { dx?: number; dy?: number; stackOffset?: number }
): { nodes: Node<ComponentNodeData>[]; edges: Edge[] } {
  const nodes: Node<ComponentNodeData>[] = [];
  const edges: Edge[] = [];

  const dx = opts?.dx ?? 220;           // horizontal spacing between siblings
  const dy = opts?.dy ?? 140;           // vertical spacing
  const stackOffset = opts?.stackOffset ?? 18; // offset to avoid collisions

  // Unique base to avoid id collisions with the existing canvas
  const base = `bom-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;

  // Occupied positions: key = "x|y" (rounded to pixel)
  const occupied = new Map<string, number>();
  const key = (x: number, y: number) => `${Math.round(x)}|${Math.round(y)}`;

  function resolvePosition(x: number, y: number) {
    const k = key(x, y);
    const count = occupied.get(k) ?? 0;
    // If already occupied, slightly offset the new node diagonally
    const px = x + count * stackOffset;
    const py = y + count * stackOffset;
    occupied.set(k, count + 1);
    return { x: px, y: py };
  }

  const idFromPath = (path: number[]) =>
    `${base}-${path.length ? path.join("-") : "root"}`;

  function walk(n: BomNode, path: number[], x: number, y: number): string {
    const id = idFromPath(path);
    const pos = resolvePosition(x, y);

    nodes.push({
      id,
      type: "componentNode",
      position: pos,
      data: {
        component: toComponent(n, dossierId),
        badge_value: n.badge_value ?? 1, // visual mirror
      },
    });

    const children = n.children ?? [];
    if (!children.length) return id;

    const totalWidth = (children.length - 1) * dx;
    children.forEach((child, idx) => {
      // Always create a fresh instance (no reuse)
      const childX = x - totalWidth / 2 + idx * dx;
      const childY = y + dy;
      const childId = walk(child, [...path, idx], childX, childY);

      edges.push({
        id: `${id}->${childId}`,
        source: id,
        target: childId,
        data: { qty: child.badge_value ?? 1 },
      });
    });

    return id;
  }

  walk(bom, [], originX, originY);
  return { nodes, edges };
}
