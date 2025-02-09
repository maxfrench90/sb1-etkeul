import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCollaboration } from './CollaborationProvider';

interface CursorPosition {
  x: number;
  y: number;
  userId: string;
  userName: string;
}

export function SharedCursor() {
  const { activeUsers } = useCollaboration();
  const [cursors, setCursors] = useState<Record<string, CursorPosition>>({});

  useEffect(() => {
    const channel = supabase.channel('cursors')
      .on('broadcast', { event: 'cursor-move' }, (payload) => {
        setCursors(prev => ({
          ...prev,
          [payload.userId]: payload
        }));
      })
      .subscribe();

    const handleMouseMove = (e: MouseEvent) => {
      const position = {
        x: e.clientX,
        y: e.clientY,
        userId: user?.id,
        userName: user?.user_metadata?.full_name
      };

      channel.send({
        type: 'broadcast',
        event: 'cursor-move',
        payload: position
      });
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <AnimatePresence>
      {Object.values(cursors).map((cursor) => (
        <motion.div
          key={cursor.userId}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          style={{
            position: 'fixed',
            left: cursor.x,
            top: cursor.y,
            pointerEvents: 'none',
            zIndex: 9999
          }}
        >
          <div className="relative">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="text-emerald-500"
            >
              <path d="M0 0l6 16h2l-2-16z" />
            </svg>
            <div className="absolute left-4 top-0 px-2 py-1 bg-emerald-500 text-white text-xs rounded whitespace-nowrap">
              {cursor.userName}
            </div>
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}