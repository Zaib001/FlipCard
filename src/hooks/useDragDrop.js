import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

const StaggerIndicator = ({ stage = 0 }) => {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (stage > 0) {
      setShowPopup(true);
      const timer = setTimeout(() => setShowPopup(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  const stages = [
    null,
    { text: 'STAGGER!', color: 'bg-yellow-500', multiplier: '1.2x' },
    { text: 'STAGGER+!', color: 'bg-orange-500', multiplier: '2x' },
    { text: 'STAGGER++!', color: 'bg-red-500', multiplier: '4x' }
  ];

  return (
    <div className="relative">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center 
        ${stages[stage]?.color || 'bg-gray-600'} text-white font-bold text-xs`}>
        {stage}
      </div>

      <AnimatePresence>
        {showPopup && stages[stage] && (
          <motion.div
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: -20 }}
            exit={{ opacity: 0, y: -40 }}
            className={`absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md 
              ${stages[stage].color} text-white font-bold whitespace-nowrap`}
          >
            {stages[stage].text} ({stages[stage].multiplier} DMG)
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};