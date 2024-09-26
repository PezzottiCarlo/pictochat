import React, { useEffect } from "react";
import { motion, MotionValue, useMotionValue, useTransform, animate } from "framer-motion";

interface CirculaCheckMarkProps {
  duration?: number; // Aggiunta della durata opzionale
}

export const CirculaCheckMark: React.FC<CirculaCheckMarkProps> = ({ duration = 0.5 }) => {
  const progress = useMotionValue(0); // Inizializza il valore progressivo
  const circleLength = useTransform(progress, [0, 100], [0, 1]);
  const checkmarkPathLength = useTransform(progress, [0, 95, 100], [0, 0, 1]);
  const circleColor = useTransform(progress, [0, 95, 100], ["#FFCC66", "#FFCC66", "#66BB66"]);

  // Usa useEffect per avviare l'animazione automaticamente
  useEffect(() => {
    const controls = animate(progress, 100, { duration }); // Anima il valore di progress a 100
    return controls.stop; // Ferma l'animazione quando il componente viene smontato
  }, [duration, progress]);

  return (
    <motion.svg xmlns="http://www.w3.org/2000/svg" width="258" height="258" viewBox="0 0 258 258">
      {/* Check mark  */}
      <motion.path
        transform="translate(60 85)"
        d="M3 50L45 92L134 3"
        fill="transparent"
        stroke="#7BB86F"
        strokeWidth={8}
        style={{ pathLength: checkmarkPathLength }}
      />
      {/* Circle */}
      <motion.path
        d="M 130 6 C 198.483 6 254 61.517 254 130 C 254 198.483 198.483 254 130 254 C 61.517 254 6 198.483 6 130 C 6 61.517 61.517 6 130 6 Z"
        fill="transparent"
        strokeWidth="8"
        stroke={circleColor}
        style={{
          pathLength: circleLength
        }}
      />
    </motion.svg>
  );
};
