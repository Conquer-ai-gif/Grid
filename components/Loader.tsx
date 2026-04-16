import { Loader2 } from 'lucide-react';

const Loader = () => {
  return (
    <div className="flex size-full items-center justify-center bg-black">
      <Loader2 size={32} className="animate-spin text-amber-1" />
    </div>
  );
};

export default Loader;
