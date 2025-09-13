// src/types.ts
// Shared TypeScript types used across the app.
export interface ComponentType {
  id: string;
  name: string;
  unit_cost: number;
  ordering_cost: number;
  carrying_cost: number;
  number_on_hand: number;
  lead_time: number;
  lot_size: number;
  badge_value?: number;
  dossierId: string;

  // Optional fields for the BOM
  isBOM?: boolean;
  bom?: any;
}

export interface BOMTree {
  component: string;
  attributes: {
    unit_cost: number;
    ordering_cost: number;
    carrying_cost: number;
    number_on_hand: number;
    lead_time: number;
    lot_size: number;
  };
  badge_value: number; // Number of units required for the parent
  children: BOMTree[]; // Sub-components
}
