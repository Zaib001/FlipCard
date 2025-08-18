// src/components/cards/GameCard.jsx
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { fadeIn } from "../../animations/motion";

// Prefer setting this in .env (Vite): VITE_API_BASE_URL="http://localhost:4000"
const API_BASE =
  import.meta?.env?.VITE_API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:4000";

/** Build a usable image URL from DB value */
function buildImageUrl(img) {
  if (!img) return null;
  // Absolute (http/https) or data: — use as-is
  if (/^(https?:)?\/\//i.test(img) || /^data:image\//i.test(img)) return img;
  // Relative path → prefix with API base if needed
  return img.startsWith("/") ? `${API_BASE}${img}` : `${API_BASE}/${img}`;
}

function clamp01(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

const statusDot = (type = "") => {
  switch (type) {
    case "Bleed": return "bg-rose-500";
    case "Burn": return "bg-orange-500";
    case "Rupture": return "bg-red-400";
    case "Sinking": return "bg-sky-400";
    case "Charge": return "bg-yellow-400";
    case "Tremor": return "bg-amber-500";
    case "Poise": return "bg-emerald-400";
    default: return "bg-purple-400";
  }
};

const GameCard = ({ char, selected, onClick, index, isAttacker, isDefender }) => {
  const characterId = char?._id || char?.id;

  // ----- Safe numbers -----
  const spMin = char?.speed?.min ?? 0;
  const spMax = char?.speed?.max ?? 0;
  // rolled speed if present; otherwise show midpoint; THEN fallback 0
  const spCur = (char?.speed?.current ?? Math.floor((spMin + spMax) / 2)) || 0;

  const hpCur = char?.hp?.current ?? 0;
  const hpMax = char?.hp?.max ?? 0;
  const hpPct = useMemo(() => (hpMax > 0 ? clamp01(hpCur / hpMax) : 0), [hpCur, hpMax]);

  // ----- Image handling -----
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const imgSrc = useMemo(() => buildImageUrl(char?.image), [char?.image]);

  // ----- Visual state -----
  const borderGlow = selected
    ? isAttacker
      ? "border-red-500/80 shadow-lg shadow-red-500/20"
      : isDefender
        ? "border-blue-500/80 shadow-lg shadow-blue-500/20"
        : "border-brand-accent/80 shadow-lg shadow-brand-accent/20"
    : "border-white/10 hover:border-white/20";

  const selectionPill =
    isAttacker ? "bg-red-500/90" : isDefender ? "bg-blue-500/90" : "bg-brand-accent/90";

  // ----- Render -----
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={fadeIn("up", "tween", (index ?? 0) * 0.1, 0.5)}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      role="button"
      aria-label={`Select ${char?.name ?? "character"}`}
      aria-pressed={!!selected}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.(characterId)}
      onClick={() => onClick?.(characterId)}
      className={`
        relative rounded-2xl p-5 cursor-pointer select-none overflow-hidden
        bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm
        border-2 transition-all duration-300 ${borderGlow}
      `}
    >
      {/* Selection indicator */}
      {selected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-full ${selectionPill}`}
        >
          {isAttacker ? "ATTACKER" : isDefender ? "DEFENDER" : "SELECTED"}
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0">
          <h3 className="text-xl font-bold tracking-tight truncate">{char?.name ?? "Unknown"}</h3>
          <p className="text-xs opacity-70 mt-1 truncate">{char?.title || "Combatant"}</p>
        </div>

        {/* Speed badge: shows range + rolled */}
        <div
          className="flex items-center gap-2 bg-black/30 px-2 py-1 rounded-full"
          title={`Speed range: ${spMin}-${spMax}${char?.speed?.current != null ? ` (rolled: ${char.speed.current})` : ""}`}
        >
          <span className="text-xs opacity-80">SPD</span>
          <span className="font-bold">{spMin}-{spMax}</span>
          {char?.speed?.current != null && (
            <span className="text-[10px] opacity-70">(rolled: {char.speed.current})</span>
          )}
        </div>
      </div>

      {/* Image (scaled to fit with fixed aspect ratio) */}
      <div className="relative w-full aspect-[4/3] mb-4 rounded-lg overflow-hidden bg-white/5">
        {imgSrc && !imgError ? (
          <>
            {!imgLoaded && (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5" />
            )}
            <img
              src={imgSrc}
              alt={char?.name ?? "Character"}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                imgLoaded ? "opacity-100" : "opacity-0"
              }`}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          </>
        ) : (
          <div className="absolute inset-0 w-full h-full grid place-items-center text-xs opacity-60">
            {/* Fallback placeholder */}
            <div className="flex items-center">
              <svg width="36" height="36" viewBox="0 0 24 24" className="opacity-60">
                <path
                  fill="currentColor"
                  d="M21 19V5a2 2 0 0 0-2-2H5C3.89 3 3 3.9 3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2m-2 0H5V5h14v14M8.5 13.5l2.5 3l3.5-4.5l4.5 6H5l3.5-4.5Z"
                />
              </svg>
              <span className="ml-2">No Image</span>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {/* HP */}
        <div className="col-span-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="opacity-80">HP</span>
            <span className="font-bold">
              {hpCur}/{hpMax}
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(hpPct * 100)}%` }}
              transition={{ duration: 0.6, type: "spring", stiffness: 120, damping: 20 }}
              className={`h-full rounded-full ${
                hpPct > 0.6 ? "bg-green-500" : hpPct > 0.3 ? "bg-yellow-500" : "bg-red-500"
              }`}
            />
          </div>
        </div>

        {/* Sanity */}
        <div className="rounded-lg bg-black/20 p-2 border border-white/10">
          <div className="opacity-80 text-xs">Sanity</div>
          <div className="text-cyan-300 font-bold">{char?.sanity ?? 0}</div>
        </div>

        {/* Defense (optional / placeholder) */}
        <div className="rounded-lg bg-black/20 p-2 border border-white/10">
          <div className="opacity-80 text-xs">Defense</div>
          <div className="text-purple-300 font-bold">{char?.defense ?? 0}</div>
        </div>
      </div>

      {/* Status Effects */}
      {Array.isArray(char?.statusEffects) && char.statusEffects.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {char.statusEffects.map((e, i) => (
            <motion.span
              key={`${e?.type ?? "effect"}-${i}`}
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-black/40 border border-white/10"
              title={`${e?.type ?? "Effect"} ×${e?.count ?? 0}${e?.potency ? ` (${e.potency})` : ""}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusDot(e?.type)}`} />
              {e?.type ?? "Effect"} ×{e?.count ?? 0}
              {e?.potency ? <span className="opacity-80 ml-1">({e.potency})</span> : null}
            </motion.span>
          ))}
        </div>
      )}

      {/* Glow ring */}
      {selected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`absolute inset-0 rounded-2xl pointer-events-none ${
            isAttacker
              ? "shadow-[0_0_24px_6px_rgba(239,68,68,0.25)]"
              : isDefender
              ? "shadow-[0_0_24px_6px_rgba(59,130,246,0.25)]"
              : "shadow-[0_0_24px_6px_rgba(99,102,241,0.25)]"
          }`}
        />
      )}
    </motion.div>
  );
};

export default GameCard;
