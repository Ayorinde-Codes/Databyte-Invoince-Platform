import { useState, useEffect } from 'react';

const CursorAnimation = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);

  return (
    <div
      className="fixed w-4 h-4 bg-blue-600 rounded-full pointer-events-none z-50 transition-all duration-100 ease-out"
      style={{
        left: mousePosition.x - 8,
        top: mousePosition.y - 8,
        transform: 'translate3d(0, 0, 0)',
      }}
    />
  );
};

export default CursorAnimation;
