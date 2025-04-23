import React from 'react';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Table2 } from 'lucide-react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger,
  TooltipProvider 
} from '@/components/ui/tooltip';

export default function ViewToggle({ currentView, onViewChange }) {
  return (
    <div className="flex items-center gap-2 bg-white rounded-lg border p-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={currentView === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('table')}
              className="gap-2"
            >
              <Table2 className="h-4 w-4" />
              <span className="hidden sm:inline">Table</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Switch to Table View (T)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={currentView === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('kanban')}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Kanban</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Switch to Kanban View (K)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}