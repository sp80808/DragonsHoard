
import { useState, useEffect } from 'react';

export const useMenuNavigation = (
    itemCount: number, 
    onSelect: (index: number) => void, 
    isActive: boolean = true,
    orientation: 'VERTICAL' | 'HORIZONTAL' = 'VERTICAL'
) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        if (!isActive || itemCount === 0) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent default scrolling for navigation keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }

            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(selectedIndex);
                return;
            }

            if (orientation === 'VERTICAL') {
                if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                    setSelectedIndex(prev => (prev - 1 + itemCount) % itemCount);
                } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                    setSelectedIndex(prev => (prev + 1) % itemCount);
                }
            } else {
                if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                    setSelectedIndex(prev => (prev - 1 + itemCount) % itemCount);
                } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                    setSelectedIndex(prev => (prev + 1) % itemCount);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActive, itemCount, selectedIndex, onSelect, orientation]);

    return { selectedIndex, setSelectedIndex };
};
