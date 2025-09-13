import { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import type { ComponentType } from "./types";
import { useI18n } from "./i18n/I18nProvider";
import { deleteDoc } from "firebase/firestore";

type Props = {
  userId: string;
  onSuccess: (updatedComponent: ComponentType) => void;
  editingComponent: ComponentType | null;
  onResetEdit: () => void;
};

export default function ComponentForm({
  userId,
  onSuccess,
  editingComponent,
  onResetEdit,
}: Props) {
  const { t } = useI18n();
  const [dossiers, setDossiers] = useState<{ id: string; nom: string }[]>([]);
  const [dossierId, setDossierId] = useState<string>("");

  // Component fields
  const [name, setName] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [orderingCost, setOrderingCost] = useState("");
  const [carryingCost, setCarryingCost] = useState("");
  const [numberOnHand, setNumberOnHand] = useState("");
  const [leadTime, setLeadTime] = useState("");
  const [lotSize, setLotSize] = useState("");

  // Load folder list on mount
  useEffect(() => {
  const fetchDossiers = async () => {
    const ref = collection(db, "users", userId, "dossiers");
    const snap = await getDocs(ref);
    const list = snap.docs.map(doc => ({
      id: doc.id,
      nom: (doc.data() as any).nom,
    }));
    setDossiers(list);

    // If no folder is selected yet, choose the first
    if (!dossierId && list.length > 0) {
      setDossierId(list[0].id);
    }
  };

  fetchDossiers();
}, [userId]);

  // Prefill fields when editing an existing component
  useEffect(() => {
    if (editingComponent) {
      setName(editingComponent.name);
      setUnitCost(editingComponent.unit_cost.toString());
      setOrderingCost(editingComponent.ordering_cost.toString());
      setCarryingCost(editingComponent.carrying_cost.toString());
      setNumberOnHand(editingComponent.number_on_hand.toString());
      setLeadTime(editingComponent.lead_time.toString());
      setLotSize(editingComponent.lot_size.toString());
    }
  }, [editingComponent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dossierId) return;

    const componentData = {
      name,
      unit_cost: parseFloat(unitCost),
      ordering_cost: parseFloat(orderingCost),
      carrying_cost: parseFloat(carryingCost),
      number_on_hand: parseInt(numberOnHand, 10),
      lead_time: parseInt(leadTime, 10),
      lot_size: parseInt(lotSize, 10),
    };

    
    if (editingComponent) {
    const originalDossierId = editingComponent.dossierId;

    if (originalDossierId === dossierId) {
        // Normal update within the same folder
        const ref = doc(db, "users", userId, "dossiers", dossierId, "composants", editingComponent.id);
        await setDoc(ref, componentData, { merge: true });
    } else {
        // Folder changed: copy with the SAME id, then delete the old one
        const oldRef = doc(db, "users", userId, "dossiers", originalDossierId, "composants", editingComponent.id);
        const newRef = doc(db, "users", userId, "dossiers", dossierId, "composants", editingComponent.id);

        // 1) Write in the new folder first (same id)
        await setDoc(newRef, componentData, { merge: false });

        // 2) Then delete the old one (after the copy succeeds)
        await deleteDoc(oldRef);
    }

    onResetEdit();
    } else {
      // Create mode
      const ref = collection(db, "users", userId, "dossiers", dossierId, "composants");
      await addDoc(ref, { ...componentData, createdAt: serverTimestamp() });
    }

    // Reset form
    setName("");
    setUnitCost("");
    setOrderingCost("");
    setCarryingCost("");
    setNumberOnHand("");
    setLeadTime("");
    setLotSize("");

    if (editingComponent) {
    onSuccess({
        id: editingComponent.id,
        name,
        unit_cost: parseFloat(unitCost),
        ordering_cost: parseFloat(orderingCost),
        carrying_cost: parseFloat(carryingCost),
        number_on_hand: parseInt(numberOnHand, 10),
        lead_time: parseInt(leadTime, 10),
        lot_size: parseInt(lotSize, 10),
        badge_value: editingComponent.badge_value ?? 1,
        dossierId,
    });
  }};

    return (
  <form onSubmit={handleSubmit} className="form-standard">
    <h2>{editingComponent ? t('form.section.edit') : t('form.section.add')}</h2>

    <label htmlFor="dossier-select">{t('form.folder')}</label>
    <select
      id="dossier-select"
      value={dossierId}
      onChange={e => setDossierId(e.target.value)}
      required
    >
      {dossiers.map(d => (
        <option key={d.id} value={d.id}>
          {d.nom}
        </option>
      ))}
    </select>

    {/* Name */}
    <div className="form-row" style={{ marginBottom: 10 }}>
    <input
        type="text"
        placeholder={t('form.name')}
        aria-label={t('form.name')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
    />
    </div>

    {/* Grid with 2 aligned columns */}
    <div className="form-grid">
    {/* Left column: LT, OH, LS */}
    <div className="form-col">
        <div className="form-row">
        <span className="abbr-badge">LT</span>
        <input
            type="number"
            min="0"
            placeholder={t('form.placeholder.leadTime')}
            aria-label={t('form.placeholder.leadTime')}
            value={leadTime}
            onChange={(e) => setLeadTime(e.target.value)}
            required
        />
        </div>

        <div className="form-row">
        <span className="abbr-badge">OH</span>
        <input
            type="number"
            min="0"
            placeholder={t('form.placeholder.onHand')}
            aria-label={t('form.placeholder.onHand')}
            value={numberOnHand}
            onChange={(e) => setNumberOnHand(e.target.value)}
            required
        />
        </div>

        <div className="form-row">
        <span className="abbr-badge">LS</span>
        <input
            type="number"
            min="0"
            placeholder={t('form.placeholder.lotSize')}
            aria-label={t('form.placeholder.lotSize')}
            value={lotSize}
            onChange={(e) => setLotSize(e.target.value)}
            required
        />
        </div>
    </div>

    {/* Right column: UC, OC, CC */}
    <div className="form-col">
        <div className="form-row">
        <span className="abbr-badge">UC</span>
        <input
            type="number"
            step="0.01"
            min="0"
            placeholder={t('form.placeholder.unitCost')}
            aria-label={t('form.placeholder.unitCost')}
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            required
        />
        </div>

        <div className="form-row">
        <span className="abbr-badge">OC</span>
        <input
            type="number"
            step="0.01"
            min="0"
            placeholder={t('form.placeholder.orderingCost')}
            aria-label={t('form.placeholder.orderingCost')}
            value={orderingCost}
            onChange={(e) => setOrderingCost(e.target.value)}
            required
        />
        </div>

        <div className="form-row">
        <span className="abbr-badge">CC</span>
        <input
            type="number"
            step="0.01"
            min="0"
            placeholder={t('form.placeholder.carryingCost')}
            aria-label={t('form.placeholder.carryingCost')}
            value={carryingCost}
            onChange={(e) => setCarryingCost(e.target.value)}
            required
        />
        </div>
    </div>
    </div>



    <button type="submit" className="button-standard">
      {editingComponent ? t('form.save') : t('form.add')}
    </button>
  </form>
);
}
