// src/components/ui/tooltip/Tooltip.tsx
"use client";

import { Popover } from '@headlessui/react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => (
  <Popover className="relative">
    <Popover.Button as="div" className="cursor-help">
      {children}
    </Popover.Button>

    <Popover.Panel className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-800 dark:bg-gray-700 rounded-lg shadow-lg">
      {content}
      <div className="absolute w-3 h-3 bg-gray-800 dark:bg-gray-700 rotate-45 -bottom-1 left-1/2 -translate-x-1/2" />
    </Popover.Panel>
  </Popover>
);

export default Tooltip;
