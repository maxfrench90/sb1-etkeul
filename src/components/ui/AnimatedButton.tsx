import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';
import type { ButtonProps } from './Button';

interface AnimatedButtonProps extends ButtonProps {
  loading?: boolean;
}

export function AnimatedButton({ loading, children, ...props }: AnimatedButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button {...props} disabled={loading || props.disabled}>
        {loading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
          />
        ) : children}
      </Button>
    </motion.div>
  );
}