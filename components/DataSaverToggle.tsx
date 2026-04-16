'use client';

import { Wifi, WifiOff } from 'lucide-react';
import { useDataSaver } from '@/hooks/useDataSaver';
import { cn } from '@/lib/utils';

export function DataSaverToggle() {
  const { isDataSaverEnabled, toggle, networkQuality } = useDataSaver();

  return (
    <button
      onClick={toggle}
      title={isDataSaverEnabled ? 'Data saver ON — click to disable' : 'Enable data saver mode'}
      className={cn(
        'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium border transition-all',
        isDataSaverEnabled
          ? 'bg-amber-5 border-amber-1 text-amber-1'
          : 'bg-surface-2 border-border-1 text-text-3 hover:border-amber-1 hover:text-amber-1'
      )}
    >
      {isDataSaverEnabled ? <WifiOff size={16} /> : <Wifi size={16} className={networkQuality === 'poor' ? 'text-red-400' : ''} />}
      <span className="max-sm:hidden">{isDataSaverEnabled ? 'Data saver ON' : 'Data saver'}</span>
      {networkQuality === 'poor' && !isDataSaverEnabled && (
        <span className="size-2 rounded-full bg-red-400 animate-pulse" />
      )}
    </button>
  );
}
