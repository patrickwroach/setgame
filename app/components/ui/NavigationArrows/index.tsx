'use client';
import Button from "@components/ui/Button";

interface NavigationArrowsProps {
    onPrevious: () => void ,
    onNext: () => void ,
    canGoBack: boolean ,
    canGoForward: boolean ,
    label: string ,
}

export default function NavigationArrows ({ 
  onPrevious,
  onNext,
  canGoBack,
  canGoForward,
  label, 
}: NavigationArrowsProps) {
    return (
    <div className="flex justify-center items-center gap-2 mt-4">
        <Button className="btn btn-primary" onClick={onPrevious} disabled={!canGoBack}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
        </Button>
        <span className="font-medium text-sm">{label}</span>
        <Button className="btn btn-primary" onClick={onNext} disabled={!canGoForward}>
           <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
        </Button>
    </div>
    );
}