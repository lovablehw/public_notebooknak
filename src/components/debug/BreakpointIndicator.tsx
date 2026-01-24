import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * Development-only debug component that shows:
 * 1. Current Tailwind breakpoint
 * 2. Viewport dimensions
 * 3. Horizontal overflow warning
 */
export function BreakpointIndicator() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const checkOverflow = () => {
      const body = document.body;
      const html = document.documentElement;
      const hasHorizontalOverflow = 
        body.scrollWidth > window.innerWidth || 
        html.scrollWidth > window.innerWidth;
      setHasOverflow(hasHorizontalOverflow);
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    
    // Check periodically for dynamic content changes
    const interval = setInterval(checkOverflow, 1000);

    return () => {
      window.removeEventListener("resize", checkOverflow);
      clearInterval(interval);
    };
  }, []);

  // Only show in development
  if (import.meta.env.PROD) return null;

  const getBreakpoint = (width: number) => {
    if (width >= 1536) return "2xl";
    if (width >= 1280) return "xl";
    if (width >= 1024) return "lg";
    if (width >= 768) return "md";
    if (width >= 640) return "sm";
    return "xs";
  };

  const breakpoint = getBreakpoint(dimensions.width);

  return (
    <>
      {/* Toggle button - always visible in dev */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={cn(
          "fixed bottom-4 left-4 z-[9999] px-2 py-1 rounded text-xs font-mono transition-colors",
          hasOverflow 
            ? "bg-destructive text-destructive-foreground animate-pulse" 
            : "bg-muted text-muted-foreground hover:bg-accent"
        )}
        title="Breakpoint debug toggle"
      >
        {hasOverflow ? "⚠️ OVERFLOW" : `📱 ${breakpoint}`}
      </button>

      {/* Debug panel */}
      {isVisible && (
        <div className="fixed bottom-14 left-4 z-[9999] bg-background border border-border rounded-lg shadow-lg p-3 text-xs font-mono space-y-2 min-w-[180px]">
          <div className="font-semibold text-foreground border-b border-border pb-1 mb-2">
            Layout Debug
          </div>
          
          {/* Breakpoint */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Breakpoint:</span>
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
              breakpoint === "xs" && "bg-red-100 text-red-700",
              breakpoint === "sm" && "bg-orange-100 text-orange-700",
              breakpoint === "md" && "bg-yellow-100 text-yellow-700",
              breakpoint === "lg" && "bg-green-100 text-green-700",
              breakpoint === "xl" && "bg-blue-100 text-blue-700",
              breakpoint === "2xl" && "bg-purple-100 text-purple-700",
            )}>
              {breakpoint}
            </span>
          </div>

          {/* Dimensions */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Viewport:</span>
            <span className="text-foreground">{dimensions.width} × {dimensions.height}</span>
          </div>

          {/* Overflow status */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Overflow:</span>
            <span className={hasOverflow ? "text-destructive font-bold" : "text-primary"}>
              {hasOverflow ? "⚠️ DETECTED" : "✓ None"}
            </span>
          </div>

          {/* Overflow highlight toggle */}
          {hasOverflow && (
            <div className="pt-2 border-t border-border text-destructive">
              Vízszintes túlcsordulás! Ellenőrizd a konténereket.
            </div>
          )}
        </div>
      )}

      {/* Visual overflow highlight on body */}
      {isVisible && hasOverflow && (
        <div className="fixed inset-0 pointer-events-none z-[9998] border-4 border-destructive/50 animate-pulse" />
      )}
    </>
  );
}
