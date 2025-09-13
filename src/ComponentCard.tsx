// src/ComponentCard.tsx
import type React from "react";
import "./ComponentCard.css";

export type ComponentCardProps = {
  name: string;
  leadTime: number;
  unitCost: number;
  onHand: number;
  orderingCost: number;
  carryingCost: number;
  lotSize: number;
  badgeValue?: number;
  sourceView?: boolean;
  // If true, render a minimal card (name only)
  minimal?: boolean;
  style?: React.CSSProperties;
};

export default function ComponentCard({
  name,
  leadTime,
  unitCost,
  onHand,
  orderingCost,
  carryingCost,
  lotSize,
  badgeValue = 1,
  sourceView = false,
  minimal = false,
  style,
}: ComponentCardProps) {
  return (
    <div className="component-card-wrapper">
      <div className="component-card" style={{ width: "140px", ...style }}>
        <div className="card-header">
          <span>{name}</span>
          {!sourceView && <span className="badge">{badgeValue}</span>}
        </div>

        {!minimal && (
          <div className="card-body">
            <div>LT: {leadTime}</div>
            <div>UC: {unitCost}€</div>
            <div>OH: {onHand}</div>
            <div>OC: {orderingCost}€</div>
            <div>LS: {lotSize}</div>
            <div>CC: {carryingCost}€</div>
          </div>
        )}
      </div>
    </div>
  );
}

