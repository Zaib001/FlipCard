import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createCharacter } from "../../api/characters";

// ------- helpers -------
const clamp = (n, min, max) => Math.max(min, Math.min(max, n ?? 0));
const asInt = (v, d = 0) => Number.isFinite(+v) ? parseInt(v, 10) : d;

const emptyCoin = { value: 1, isNegative: false };
const emptySkill = {
    name: "",
    description: "",
    basePower: 0,
    coins: [{ ...emptyCoin }],
    attackWeight: 1,
    effects: [],
    skillLevel: 1,
    guardType: null, // "Evade" | "Block" | "Counter" | "ClashableCounter" | null
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.96, y: 8 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "tween", duration: 0.2 } },
    exit: { opacity: 0, scale: 0.98, y: 8, transition: { duration: 0.15 } },
};

export default function AddCharacterModal({ open, onClose, onCreated }) {
    const [name, setName] = useState("");
    const [hp, setHp] = useState({ current: 100, max: 100 });
    const [speed, setSpeed] = useState({ min: 3, max: 7 });
    const [sanity, setSanity] = useState(0);
    const [skills, setSkills] = useState([{ ...emptySkill }]);
    const [weaknesses, setWeaknesses] = useState(["Slash"]);
    const [isActive, setIsActive] = useState(true);
    const [statusEffects] = useState([]); // reserved for future UI
    const [charge] = useState({ potency: 0, count: 0 });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({}); // field-specific
    const [formError, setFormError] = useState("");

    // reset when opened/closed
    useEffect(() => {
        if (!open) return;
        setName("");
        setHp({ current: 100, max: 100 });
        setSpeed({ min: 3, max: 7 });
        setSanity(0);
        setSkills([{ ...emptySkill }]);
        setWeaknesses(["Slash"]);
        setIsActive(true);
        setImageFile(null);
        setImagePreview(null);
        setSubmitting(false);
        setErrors({});
        setFormError("");
    }, [open]);

    // derived validations
    const guardCount = useMemo(
        () => skills.filter((s) => Number(s.skillLevel) === 5).length,
        [skills]
    );

    const canSubmit = useMemo(() => {
        if (!name.trim()) return false;
        if (!(hp.max >= 1)) return false;
        if (!(hp.current >= 0 && hp.current <= hp.max)) return false;
        if (!(speed.min >= 1 && speed.max >= 1)) return false;
        if (speed.min > speed.max) return false;
        if (sanity < -45 || sanity > 45) return false;
        if (!skills.length) return false;
        if (guardCount > 1) return false;
        for (const s of skills) {
            if (!s.name.trim()) return false;
            if (s.basePower < 0) return false;
            if (s.attackWeight < 1) return false;
            if (![1, 2, 3, 4, 5].includes(Number(s.skillLevel))) return false;
            if (Array.isArray(s.coins) && s.coins.length > 5) return false;
            for (const c of s.coins || []) if (c.value < 1) return false;
        }
        if ((weaknesses || []).filter(Boolean).length > 5) return false;
        return true;
    }, [name, hp, speed, sanity, skills, weaknesses, guardCount]);

    // ---------- handlers ----------
    function setSkill(si, patch) {
        setSkills((prev) => prev.map((s, i) => (i === si ? { ...s, ...patch } : s)));
    }
    function addSkill() {
        setSkills((prev) => [...prev, { ...emptySkill }]);
    }
    function removeSkill(si) {
        setSkills((prev) => prev.filter((_, i) => i !== si));
    }
    function addCoin(si) {
        setSkills((prev) =>
            prev.map((s, i) =>
                i === si ? { ...s, coins: [...(s.coins || []), { ...emptyCoin }] } : s
            )
        );
    }
    function setCoin(si, ci, patch) {
        setSkills((prev) =>
            prev.map((s, i) =>
                i === si
                    ? { ...s, coins: s.coins.map((c, j) => (j === ci ? { ...c, ...patch } : c)) }
                    : s
            )
        );
    }
    function removeCoin(si, ci) {
        setSkills((prev) =>
            prev.map((s, i) =>
                i === si ? { ...s, coins: s.coins.filter((_, j) => j !== ci) } : s
            )
        );
    }

    function onPickImage(e) {
        const f = e.target.files?.[0];
        if (!f) return;
        setImageFile(f);
        setImagePreview(URL.createObjectURL(f));
    }

    function setWeakness(i, val) {
        setWeaknesses((prev) => prev.map((w, idx) => (idx === i ? val : w)));
    }

    // ---------- submit ----------
    async function handleSubmit(e) {
        e.preventDefault();
        setFormError("");
        setErrors({});

        // client validations
        const newErrors = {};
        if (!name.trim()) newErrors.name = "Name is required";
        if (hp.max < 1) newErrors.hpmax = "Max HP must be at least 1";
        if (hp.current < 0) newErrors.hpcur = "HP cannot be negative";
        if (hp.current > hp.max) newErrors.hpcur = "Current HP cannot exceed Max HP";
        if (speed.min < 1 || speed.max < 1) newErrors.speed = "Speed must be ≥ 1";
        if (speed.min > speed.max) newErrors.speed = "Min speed cannot exceed Max speed";
        if (sanity < -45 || sanity > 45) newErrors.sanity = "Sanity must be between -45 and 45";

        if (!skills.length) newErrors.skills = "At least one skill is required";
        if (guardCount > 1) newErrors.guard = "Only one level-5 (guard) skill allowed";

        skills.forEach((s, i) => {
            if (!s.name.trim()) newErrors[`skill_${i}_name`] = "Skill name required";
            if (s.basePower < 0) newErrors[`skill_${i}_bp`] = "Base power cannot be negative";
            if (s.attackWeight < 1) newErrors[`skill_${i}_aw`] = "Attack weight must be ≥ 1";
            if (![1, 2, 3, 4, 5].includes(Number(s.skillLevel))) {
                newErrors[`skill_${i}_lvl`] = "Level must be 1..5";
            }
            if ((s.coins || []).length > 5) newErrors[`skill_${i}_coins`] = "Max 5 coins";
            (s.coins || []).forEach((c, j) => {
                if (c.value < 1) newErrors[`skill_${i}_coin_${j}`] = "Coin value must be ≥ 1";
            });
        });

        if (Object.keys(newErrors).length) {
            setErrors(newErrors);
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                name: name.trim(),
                hp: { current: clamp(asInt(hp.current, 0), 0, asInt(hp.max, 1)), max: asInt(hp.max, 1) },
                speed: { min: asInt(speed.min, 1), max: asInt(speed.max, 1) },
                sanity: asInt(sanity, 0),
                skills: skills.map((s) => ({
                    ...s,
                    name: s.name.trim(),
                    description: s.description?.slice(0, 200) || "",
                    basePower: asInt(s.basePower, 0),
                    attackWeight: asInt(s.attackWeight, 1),
                    skillLevel: asInt(s.skillLevel, 1),
                    coins: (s.coins || []).slice(0, 5).map((c) => ({
                        value: asInt(c.value, 1),
                        isNegative: !!c.isNegative,
                    })),
                    guardType: s.guardType || null,
                })),
                statusEffects, // []
                charge,        // { potency:0, count:0 }
                weaknesses: (weaknesses || []).filter((w) => !!w && w.trim()).slice(0, 5),
                isActive: !!isActive,
                imageFile,     // handled by multipart
            };

            const created = await createCharacter(payload);
            onCreated?.(created); // parent can refresh list + close modal
        } catch (err) {
            setFormError(err?.message || "Failed to create character");
        } finally {
            setSubmitting(false);
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !submitting && onClose?.()} />
            <div className="absolute inset-0 grid place-items-center p-4">
                <AnimatePresence>
                    <motion.div
                        key="add-char-modal"
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        variants={modalVariants}
                        className="w-full max-w-4xl rounded-2xl border border-white/10 bg-[#0B0F16]/95 shadow-2xl 
             max-h-[90vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">                            <div>
                            <div className="text-xs opacity-70">Roster</div>
                            <h2 className="text-xl font-semibold">Create Character</h2>
                        </div>
                            <button
                                onClick={() => !submitting && onClose?.()}
                                className="rounded-lg border border-white/10 px-3 py-1.5 hover:border-white/30 disabled:opacity-60"
                                disabled={submitting}
                            >
                                Close
                            </button>
                        </div>

                        {/* Body */}
                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                        <form onSubmit={handleSubmit} className="p-5 space-y-6">
                            {formError && (
                                <div className="rounded-lg border border-rose-400/50 bg-rose-500/10 p-3 text-sm text-rose-200">
                                    {formError}
                                </div>
                            )}

                            {/* Identity & Image */}
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm mb-1">Name</label>
                                    <input
                                        className={`w-full rounded-lg border px-3 py-2 bg-white/5 border-white/10 focus:outline-none ${errors.name ? "border-rose-400" : ""}`}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Ishmael"
                                        maxLength={50}
                                        required
                                    />
                                    {errors.name && <p className="text-xs text-rose-300 mt-1">{errors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm mb-1">Image</label>
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={onPickImage}
                                        className="w-full text-sm file:mr-2 file:rounded-md file:border file:border-white/10 file:bg-white/10 file:px-2 file:py-1"
                                    />
                                    <div className="mt-2 h-24 rounded-lg border border-white/10 bg-white/5 overflow-hidden grid place-items-center">
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs opacity-60">No image selected</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Core Stats */}
                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm mb-1">HP (current / max)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            className={`w-full rounded-lg border px-3 py-2 bg-white/5 border-white/10 ${errors.hpcur ? "border-rose-400" : ""}`}
                                            min={0}
                                            value={hp.current}
                                            onChange={(e) => setHp((h) => ({ ...h, current: asInt(e.target.value, 0) }))}
                                        />
                                        <input
                                            type="number"
                                            className={`w-full rounded-lg border px-3 py-2 bg-white/5 border-white/10 ${errors.hpmax ? "border-rose-400" : ""}`}
                                            min={1}
                                            value={hp.max}
                                            onChange={(e) => setHp((h) => ({ ...h, max: asInt(e.target.value, 1) }))}
                                        />
                                    </div>
                                    {(errors.hpcur || errors.hpmax) && (
                                        <p className="text-xs text-rose-300 mt-1">{errors.hpcur || errors.hpmax}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm mb-1">Speed (min / max)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            className={`w-full rounded-lg border px-3 py-2 bg-white/5 border-white/10 ${errors.speed ? "border-rose-400" : ""}`}
                                            min={1}
                                            value={speed.min}
                                            onChange={(e) => setSpeed((s) => ({ ...s, min: asInt(e.target.value, 1) }))}
                                        />
                                        <input
                                            type="number"
                                            className={`w-full rounded-lg border px-3 py-2 bg-white/5 border-white/10 ${errors.speed ? "border-rose-400" : ""}`}
                                            min={1}
                                            value={speed.max}
                                            onChange={(e) => setSpeed((s) => ({ ...s, max: asInt(e.target.value, 1) }))}
                                        />
                                    </div>
                                    {errors.speed && <p className="text-xs text-rose-300 mt-1">{errors.speed}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm mb-1">Sanity</label>
                                    <input
                                        type="number"
                                        className={`w-full rounded-lg border px-3 py-2 bg-white/5 border-white/10 ${errors.sanity ? "border-rose-400" : ""}`}
                                        value={sanity}
                                        onChange={(e) => setSanity(asInt(e.target.value, 0))}
                                        min={-45}
                                        max={45}
                                    />
                                    {errors.sanity && <p className="text-xs text-rose-300 mt-1">{errors.sanity}</p>}
                                </div>
                            </div>

                            {/* Skills */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">Skills</h3>
                                    <button
                                        type="button"
                                        onClick={addSkill}
                                        className="text-sm rounded-lg border border-white/10 px-3 py-1 hover:border-brand-accent/60"
                                    >
                                        + Add Skill
                                    </button>
                                </div>

                                {errors.skills && <p className="text-xs text-rose-300">{errors.skills}</p>}
                                {errors.guard && <p className="text-xs text-rose-300">{errors.guard}</p>}

                                <div className="space-y-3">
                                    {skills.map((s, si) => (
                                        <div key={si} className="rounded-xl border border-white/10 bg-white/5 p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="text-xs opacity-70">Skill #{si + 1}</div>
                                                {skills.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSkill(si)}
                                                        className="text-xs rounded-md border border-white/10 px-2 py-1 hover:border-rose-400/60"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>

                                            <div className="grid md:grid-cols-3 gap-2">
                                                <div>
                                                    <input
                                                        className={`w-full rounded-lg border px-3 py-2 bg-white/5 border-white/10 ${errors[`skill_${si}_name`] ? "border-rose-400" : ""}`}
                                                        placeholder="Name"
                                                        value={s.name}
                                                        onChange={(e) => setSkill(si, { name: e.target.value })}
                                                        maxLength={30}
                                                        required
                                                    />
                                                    {errors[`skill_${si}_name`] && (
                                                        <p className="text-xs text-rose-300 mt-1">{errors[`skill_${si}_name`]}</p>
                                                    )}
                                                </div>
                                                <input
                                                    className="w-full rounded-lg border px-3 py-2 bg-white/5 border-white/10"
                                                    placeholder="Description (optional)"
                                                    value={s.description}
                                                    onChange={(e) => setSkill(si, { description: e.target.value })}
                                                    maxLength={200}
                                                />
                                                <select
                                                    className={`w-full rounded-lg border px-3 py-2 bg-white/5 border-white/10 ${errors[`skill_${si}_lvl`] ? "border-rose-400" : ""}`}
                                                    value={s.skillLevel}
                                                    onChange={(e) => setSkill(si, { skillLevel: asInt(e.target.value, 1) })}
                                                >
                                                    {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>Level {v}</option>)}
                                                </select>
                                            </div>

                                            <div className="grid md:grid-cols-3 gap-2 mt-2">
                                                <div>
                                                    <label className="block text-xs opacity-70 mb-1">Base Power</label>
                                                    <input
                                                        type="number"
                                                        className={`w-full rounded-lg border px-3 py-2 bg-white/5 border-white/10 ${errors[`skill_${si}_bp`] ? "border-rose-400" : ""}`}
                                                        value={s.basePower}
                                                        min={0}
                                                        onChange={(e) => setSkill(si, { basePower: asInt(e.target.value, 0) })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs opacity-70 mb-1">Attack Weight</label>
                                                    <input
                                                        type="number"
                                                        className={`w-full rounded-lg border px-3 py-2 bg-white/5 border-white/10 ${errors[`skill_${si}_aw`] ? "border-rose-400" : ""}`}
                                                        value={s.attackWeight}
                                                        min={1}
                                                        onChange={(e) => setSkill(si, { attackWeight: asInt(e.target.value, 1) })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs opacity-70 mb-1">Guard Type</label>
                                                    <select
                                                        className="w-full rounded-lg border px-3 py-2 bg-white/5 border-white/10"
                                                        value={s.guardType || ""}
                                                        onChange={(e) => setSkill(si, { guardType: e.target.value || null })}
                                                    >
                                                        <option value="">No Guard</option>
                                                        <option value="Evade">Evade</option>
                                                        <option value="Block">Block</option>
                                                        <option value="Counter">Counter</option>
                                                        <option value="ClashableCounter">ClashableCounter</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Coins */}
                                            <div className="mt-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="text-xs opacity-70">Coins (max 5)</div>
                                                    <button
                                                        type="button"
                                                        onClick={() => addCoin(si)}
                                                        className="text-xs rounded-md border border-white/10 px-2 py-1 hover:border-brand-accent/60"
                                                        disabled={(s.coins || []).length >= 5}
                                                    >
                                                        + Add Coin
                                                    </button>
                                                </div>
                                                {errors[`skill_${si}_coins`] && (
                                                    <p className="text-xs text-rose-300 mt-1">{errors[`skill_${si}_coins`]}</p>
                                                )}
                                                <div className="mt-2 space-y-2">
                                                    {(s.coins || []).map((c, ci) => (
                                                        <div key={ci} className="grid grid-cols-3 gap-2 items-center">
                                                            <div>
                                                                <label className="block text-xs opacity-70 mb-1">Value</label>
                                                                <input
                                                                    type="number"
                                                                    min={1}
                                                                    className={`w-full rounded-lg border px-3 py-2 bg-white/5 border-white/10 ${errors[`skill_${si}_coin_${ci}`] ? "border-rose-400" : ""}`}
                                                                    value={c.value}
                                                                    onChange={(e) => setCoin(si, ci, { value: asInt(e.target.value, 1) })}
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    id={`neg-${si}-${ci}`}
                                                                    type="checkbox"
                                                                    checked={!!c.isNegative}
                                                                    onChange={(e) => setCoin(si, ci, { isNegative: e.target.checked })}
                                                                />
                                                                <label htmlFor={`neg-${si}-${ci}`} className="text-sm">Negative</label>
                                                            </div>
                                                            <div className="flex justify-end">
                                                                {(s.coins || []).length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeCoin(si, ci)}
                                                                        className="text-xs rounded-md border border-white/10 px-2 py-1 hover:border-rose-400/60"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Weaknesses / Active */}
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm mb-1">Weaknesses (max 5)</label>
                                    <div className="space-y-2">
                                        {(weaknesses || []).map((w, i) => (
                                            <input
                                                key={i}
                                                className="w-full rounded-lg border px-3 py-2 bg-white/5 border-white/10"
                                                value={w}
                                                onChange={(e) => setWeakness(i, e.target.value)}
                                                placeholder="Slash / Pierce / etc."
                                            />
                                        ))}
                                        {(weaknesses || []).length < 5 && (
                                            <button
                                                type="button"
                                                onClick={() => setWeaknesses((prev) => [...prev, ""])}
                                                className="text-xs rounded-md border border-white/10 px-2 py-1 hover:border-brand-accent/60"
                                            >
                                                + Add Weakness
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm mb-1">Active</label>
                                    <label className="inline-flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={!!isActive}
                                            onChange={(e) => setIsActive(e.target.checked)}
                                        />
                                        Is Active
                                    </label>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-2">
                                <div className="text-xs opacity-60">
                                    {guardCount > 1 ? (
                                        <span className="text-rose-300">Only one Level 5 (guard) skill allowed.</span>
                                    ) : (
                                        <span>Tip: Guard skills are usually Level 5 (Evade/Block/Counter).</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onClose?.()}
                                        className="rounded-lg border border-white/10 px-4 py-2 hover:border-white/30 disabled:opacity-60"
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting || !canSubmit}
                                        className={`rounded-lg px-4 py-2 border backdrop-blur-sm transition-all
                      ${submitting || !canSubmit
                                                ? "border-white/10 bg-white/5 opacity-60 cursor-not-allowed"
                                                : "border-white/10 bg-white/5 hover:border-brand-accent/60"}`}
                                    >
                                        {submitting ? "Creating..." : "Create Character"}
                                    </button>
                                </div>
                            </div>
                        </form>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
