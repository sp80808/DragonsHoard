
import { useState, useEffect } from 'react';
import { OrientationSetting } from '../types';

export const useOrientation = (setting: OrientationSetting) => {
    // Default to device state
    const [deviceLandscape, setDeviceLandscape] = useState(() => 
        typeof window !== 'undefined' ? window.matchMedia('(orientation: landscape)').matches : true
    );

    useEffect(() => {
        const mql = window.matchMedia('(orientation: landscape)');
        const handler = (e: MediaQueryListEvent) => setDeviceLandscape(e.matches);
        
        // Initial check
        setDeviceLandscape(mql.matches);

        // Listeners
        if (mql.addEventListener) {
            mql.addEventListener('change', handler);
        } else {
            mql.addListener(handler);
        }

        return () => {
            if (mql.removeEventListener) {
                mql.removeEventListener('change', handler);
            } else {
                mql.removeListener(handler);
            }
        };
    }, []);

    if (setting === 'LANDSCAPE') return true;
    if (setting === 'PORTRAIT') return false;
    
    // AUTO
    return deviceLandscape;
};
