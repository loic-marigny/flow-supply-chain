// src/ComponentNode.tsx
// React Flow custom node rendering a component card with an editable quantity badge.
import { memo, useState, useRef, useEffect } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "reactflow";
import "./ComponentCard.css";
import type { ComponentType } from "./types";
import { useI18n } from "./i18n/I18nProvider";

type ComponentNodeData = {
  component: ComponentType;
  badge_value?: number;
};

export default memo(function ComponentNode({ id, data, selected }: NodeProps<ComponentNodeData>) {
  const { t, lang } = useI18n();
  const { setNodes, setEdges } = useReactFlow();

  const [count, setCount] = useState<number>(data.badge_value ?? 1);
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(count.toString());
  const inputRef = useRef<HTMLInputElement>(null);
  const [hovering, setHovering] = useState(false);

  // Numbers: integers localized; money auto-formatted in EUR (same spirit as source list)
  const locale = lang === "fr" ? "fr-FR" : lang === "ru" ? "ru-RU" : "en-US";
  const formatInt = (n: number) => {
    const v = Number(n) || 0;
    try { return v.toLocaleString(locale); } catch { return String(v); }
  };
  const formatMoney = (n: number) => {
    const v = Number(n) || 0;
    try {
      return v.toLocaleString(undefined, {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    } catch {
      return Number.isInteger(v) ? `${v} €` : `${v.toFixed(2)} €`;
    }
  };

  useEffect(() => {
    setCount(data.badge_value ?? 1);
    if ((data.badge_value ?? 1) <= 0) {
      setNodes((nodes) => nodes.filter((n) => n.id !== id));
      setEdges((edges) => edges.filter((e) => e.source !== id && e.target !== id));
    }
  }, [data.badge_value, id, setNodes, setEdges]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const updateBadge = (newVal: number) => {
    setNodes((nodes) => nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, badge_value: newVal } } : n)));
    setEdges((edges) => edges.map((e) => (e.target === id ? { ...e, data: { ...(e.data || {}), qty: newVal } } : e)));
  };

  const saveBadge = () => {
    const newVal = parseInt(tempValue, 10);
    if (!isNaN(newVal)) updateBadge(newVal);
    setIsEditing(false);
  };

  const onIncrement = () => updateBadge(count + 1);
  const onDecrement = () => updateBadge(Math.max(count - 1, 0));

  return (
    <div
      className="component-node-wrapper"
      style={{
        border: selected ? "2px solid #000000ff" : "none",
        borderRadius: 14,
        boxSizing: "border-box",
        boxShadow: selected ? "0 0 10px 2px rgba(67, 52, 114, 0.3)" : "0 2px 6px rgba(0,0,0,0.15)",
      }}
    >
      <div className="component-card-wrapper">
        {isEditing ? (
          <input
            ref={inputRef}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={saveBadge}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveBadge();
              if (e.key === "Escape") { setIsEditing(false); setTempValue(count.toString()); }
            }}
            inputMode="numeric"
            pattern="[0-9]*"
            role="spinbutton"
            aria-label={t("node.quantity")}
            aria-valuenow={count}
            aria-valuemin={0}
            draggable={false}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            autoFocus
            style={{ position: "absolute", top: -8, right: -8, width: 18, height: 20, borderRadius: 9999, backgroundColor: "#AA9D9F", color: "#D2D2EB", textAlign: "center", fontWeight: "bold", fontSize: "0.6em", outline: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
          />
        ) : (
          <span
            className="badge mauve"
            title={t("node.badge.edit.title")}
            tabIndex={0}
            role="button"
            aria-label={t("node.badge.edit.aria", { count })}
            onClick={() => { setTempValue(count.toString()); setIsEditing(true); }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setTempValue(count.toString()); setIsEditing(true); } }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            style={{ position: "absolute", top: -8, right: -8, cursor: "text", zIndex: 10, borderRadius: 9999, width: 22, height: 22, fontSize: "0.7rem", color: "#D2D2EB", fontFamily: "sans-serif", boxShadow: hovering ? "0 0 6px 2px rgba(210,210,250,0.2)" : "0 1px 3px rgba(0,0,0,0.2)", transition: "box-shadow 0.2s ease" }}
          >
            {count}
          </span>
        )}

        <div className="component-card">
          <div className="card-header">
            <span>{data.component.name}</span>
          </div>
          <div className="card-body">
            <div>
              <div>LT: {formatInt(data.component.lead_time)}</div>
              <div>OH: {formatInt(data.component.number_on_hand)}</div>
              <div>LS: {formatInt(data.component.lot_size)}</div>
            </div>
            <div>
              <div>UC: {formatMoney(data.component.unit_cost)}</div>
              <div>OC: {formatMoney(data.component.ordering_cost)}</div>
              <div>CC: {formatMoney(data.component.carrying_cost)}</div>
            </div>
          </div>
        </div>
      </div>

      <button type="button" className="handle minus" aria-label={t("node.minus.aria")} title={t("node.minus.title")} onClick={onDecrement} draggable={false} onPointerDown={(e) => e.stopPropagation()}>
        -
      </button>
      <button type="button" className="handle plus" aria-label={t("node.plus.aria")} title={t("node.plus.title")} onClick={onIncrement} draggable={false} onPointerDown={(e) => e.stopPropagation()}>
        +
      </button>

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});
