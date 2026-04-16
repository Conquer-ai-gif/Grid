'use client';

import { ReactNode } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent } from './ui/dialog';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  className?: string;
  children?: ReactNode;
  handleClick?: () => void;
  buttonText?: string;
  image?: string;
  buttonClassName?: string;
  buttonIcon?: string;
}

const MeetingModal = ({ isOpen, onClose, title, className, children, handleClick, buttonText, image, buttonClassName, buttonIcon }: MeetingModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex w-full max-w-[520px] flex-col gap-6 border border-border-1 bg-surface-1 px-6 py-9 text-text-1">
        <div className="flex flex-col gap-6">
          {image && (
            <div className="flex justify-center">
              <Image src={image} alt="icon" width={72} height={72} />
            </div>
          )}
          <h1 className={cn('text-2xl font-bold text-text-1', className)}>{title}</h1>
          {children}
          <Button
            className="bg-amber-1 hover:bg-amber-4 text-black font-semibold focus-visible:ring-0 focus-visible:ring-offset-0"
            onClick={handleClick}
          >
            {buttonIcon && <Image src={buttonIcon} alt="icon" width={13} height={13} className="mr-1" />}
            {buttonText || 'Schedule meeting'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingModal;
