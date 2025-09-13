// src/utils/bomValidation.ts
// Validates a BOM graph represented as React Flow nodes/edges.
import type { Edge, Node } from 'reactflow';

type ValidationResult = {
  valid: boolean;
  error?: string;
};

export function validateBOM(nodes: Node[], edges: Edge[]): ValidationResult {
  if (nodes.length === 0) {
    return { valid: false, error: "Aucun composant présent dans le BOM." };
  }

  const parentsMap = new Map<string, string[]>(); // nodeId -> children
  const childrenMap = new Map<string, string[]>(); // nodeId -> parents
  const nameById = new Map<string, string>();
  const compIdById = new Map<string, string>();
  for (const n of nodes) {
    const nm = (n as any)?.data?.component?.name;
    nameById.set(n.id, typeof nm === 'string' && nm ? nm : n.id);
    const cid = (n as any)?.data?.component?.id;
    compIdById.set(n.id, typeof cid === 'string' && cid ? cid : n.id);
  }

  for (const edge of edges) {
    const { source, target } = edge;

    // Self-loop guard (node-level)
    if (source === target) {
      const nm = nameById.get(source) ?? source;
      return { valid: false, error: `Le composant "${nm}" ne peut pas être son propre sous-composant.` };
    }
    // Self-subcomponent guard (same underlying component id across different nodes)
    const sComp = compIdById.get(source);
    const tComp = compIdById.get(target);
    if (sComp && tComp && sComp === tComp) {
      const nm = nameById.get(source) ?? nameById.get(target) ?? sComp;
      return { valid: false, error: `Le composant "${nm}" ne peut pas être son propre sous-composant.` };
    }

    if (!parentsMap.has(source)) parentsMap.set(source, []);
    parentsMap.get(source)!.push(target);

    if (!childrenMap.has(target)) childrenMap.set(target, []);
    childrenMap.get(target)!.push(source);
  }

  // 1. Find the root (no parent)
  const rootCandidates = nodes.filter(node => !childrenMap.has(node.id));
  // Early cycle detection to return a clearer message even when no unique root exists
  {
    const visitedAll = new Set<string>();
    const inStackAll = new Set<string>();
    const pathAll: string[] = [];
    let cycleMsg: string | null = null;

    const dfsAll = (id: string): boolean => {
      if (inStackAll.has(id)) {
        const idx = pathAll.indexOf(id);
        const cycIds = pathAll.slice(idx).concat(id);
        const cycNames = cycIds.map(x => nameById.get(x) ?? x);
        cycleMsg = `Cycle détecté: ${cycNames.join(' -> ')}. Un composant ne peut pas être (directement ou indirectement) son propre sous-composant.`;
        return true;
      }
      if (visitedAll.has(id)) return false;
      visitedAll.add(id);
      inStackAll.add(id);
      pathAll.push(id);
      const ch = parentsMap.get(id) || [];
      for (const c of ch) { if (dfsAll(c)) return true; }
      inStackAll.delete(id);
      pathAll.pop();
      return false;
    };

    for (const n of nodes) {
      if (!visitedAll.has(n.id) && dfsAll(n.id)) {
        return { valid: false, error: cycleMsg ?? "Cycle détecté dans le BOM." };
      }
    }
  }
  if (rootCandidates.length !== 1) {
    return {
      valid: false,
      error: `Il doit y avoir exactement un produit fini (racine), trouvé : ${rootCandidates.length}.`,
    };
  }
  const rootId = rootCandidates[0].id;

  // 2. Every node (except the root) must have exactly one parent
  for (const node of nodes) {
    if (node.id === rootId) continue;
    const parents = childrenMap.get(node.id) || [];
    if (parents.length !== 1) {
      return {
        valid: false,
        error: `Le composant "${node.data.component.name}" doit avoir exactement un parent (trouvé ${parents.length}).`,
      };
    }
  }

  // 3. Detect cycles (direct or indirect)
  const visited = new Set<string>();
  const stack = new Set<string>();

  function dfs(nodeId: string): boolean {
    if (stack.has(nodeId)) return true; // cycle detected
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    stack.add(nodeId);

    const children = parentsMap.get(nodeId) || [];
    for (const childId of children) {
      if (dfs(childId)) return true;
    }

    stack.delete(nodeId);
    return false;
  }

  if (dfs(rootId)) {
    return {
      valid: false,
      error: "Un composant entre indirectement ou directement dans sa propre composition (cycle détecté).",
    };
  }

  // 4. Ensure each instance of the same component has the same child set
  const componentSubMap = new Map<string, string[]>(); // name -> sorted child names

  for (const node of nodes) {
    const currentComponent = node.data?.component;

    if (!currentComponent) {
      return { valid: false, error: `Le composant avec l'id ${node.id} est mal formé.` };
    }

    const name = currentComponent.name;
    const childrenIds = parentsMap.get(node.id) || [];
    const childrenNames = childrenIds
      .map(id => nodes.find(n => n.id === id)?.data.component.name)
      .filter(Boolean)
      .sort();

    if (componentSubMap.has(name)) {
      const prev = componentSubMap.get(name)!;
      if (JSON.stringify(prev) !== JSON.stringify(childrenNames)) {
        return {
          valid: false,
          error: `Le composant "${name}" apparaît avec des sous-composants différents à différents endroits du BOM.`,
        };
      }
    } else {
      componentSubMap.set(name, childrenNames);
    }
  }

  // 5. Ensure a component is not duplicated at the same level under a parent
  for (const [_, childIds] of parentsMap.entries()) {
    const childNames = childIds.map(id => nodes.find(n => n.id === id)?.data.component.name);
    const nameCounts = new Map<string, number>();

    for (const name of childNames) {
      if (!name) continue;
      nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
    }

    for (const [name, count] of nameCounts.entries()) {
      if (count > 1) {
        return {
          valid: false,
          error: `Le composant "${name}" est présent plusieurs fois sous le même parent. Il doit être fusionné en un seul avec une quantité totale.`,
        };
      }
    }
  }


  // 6. Particular cases when there is no link
    if (edges.length === 0) {
    if (nodes.length === 1) {
        // Single component without edges: valid BOM
        return { valid: true };
    }
    // Several components without relationship : invalid BOM
    return { valid: false, error: "Plusieurs composants non reliés entre eux." };
    }

    // 7. Ensure there are no orphan nodes
    const connectedIds = new Set(edges.flatMap(e => [e.source, e.target]));
    for (const node of nodes) {
    if (!connectedIds.has(node.id)) {
        return {
        valid: false,
        error: `Le composant "${node.data.component.name}" n'est relié à aucun autre dans le BOM.`,
        };
    }
    }

  return { valid: true };
}




