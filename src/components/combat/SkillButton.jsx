// src/components/combat/SkillButton.jsx
import { motion } from "framer-motion";

export default function SkillButton({ skill, onUse, isSelected, flipping }) {
  const coins = Array.isArray(skill?.coins) ? skill.coins.length : 0;

  return (
    <motion.button
      type="button"
      whileHover={{ scale: flipping ? 1 : 1.05, y: flipping ? 0 : -2 }}
      whileTap={{ scale: flipping ? 0.98 : 0.95 }}
      disabled={flipping}
      onClick={() => {
        if (isSelected) {
          onUse?.(null);
        } else {
          onUse?.(skill);
        }
      }}
      className={`relative text-left rounded-lg p-3 border-2 transition-all overflow-hidden
        ${isSelected
          ? "border-amber-400 bg-gradient-to-br from-amber-900/30 to-amber-800/20 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/50"
          : "border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 hover:border-amber-300 hover:bg-gray-800/80"
        } ${flipping ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}
      `}
      title={skill?.description || skill?.name}
    >
      {/* Glow effect for selected state */}
      {isSelected && (
        <motion.div 
          className="absolute inset-0 bg-amber-400/10 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5 }}
        />
      )}
      
      {/* Top section with skill name */}
      <div className="flex items-center justify-between relative z-10">
        <div className="font-bold text-gray-100 truncate text-shadow">
          {skill?.name ?? "Skill"}
        </div>
        {skill?.guardType && (
          <span className="text-xs px-2 py-1 rounded-full bg-black/60 border border-amber-400/50 text-amber-300 font-semibold tracking-wide">
            {skill.guardType}
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="mt-3 flex items-center flex-wrap gap-x-3 gap-y-1 text-xs relative z-10">
        <div className="flex items-center">
          <span className="text-gray-400 mr-1">PWR:</span>
          <span className="font-bold text-white">{skill?.basePower ?? 0}</span>
        </div>
        
        <div className="w-px h-4 bg-gray-600" />
        
        <div className="flex items-center">
          <span className="text-gray-400 mr-1">COINS:</span>
          <span className="font-bold text-white">{coins}</span>
        </div>
        
        {typeof skill?.attackWeight === "number" && (
          <>
            <div className="w-px h-4 bg-gray-600" />
            <div className="flex items-center">
              <span className="text-gray-400 mr-1">WGT:</span>
              <span className="font-bold text-white">{skill.attackWeight}</span>
            </div>
          </>
        )}
      </div>

      {/* Description */}
      {skill?.description && (
        <div className="mt-3 pt-2 text-xs text-gray-300 border-t border-gray-700/50 relative z-10 line-clamp-2">
          {skill.description}
        </div>
      )}
      
      {/* Bottom border accent */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${
        isSelected ? 'bg-amber-400' : 'bg-gray-600'
      }`} />
    </motion.button>
  );
}