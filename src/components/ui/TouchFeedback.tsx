import React from 'react';
import { motion } from 'framer-motion';

interface TouchFeedbackProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
  disabled?: boolean;
}

export function TouchFeedback({
  children,
  onPress,
  className = '',
  disabled = false
}: TouchFeedbackProps) {
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={disabled ? undefined : onPress}
      className={`touch-none ${className} ${disabled ? 'opacity-50' : ''}`}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
}