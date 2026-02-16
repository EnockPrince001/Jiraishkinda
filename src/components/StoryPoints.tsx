import { useState } from "react";
import { Check, X, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const STORY_POINTS = [1, 2, 3, 5, 8, 13, 21];

interface StoryPointsProps {
  value?: number | null;
  onSave: (value: number | null) => Promise<void>;
  className?: string; // ✅ added
}

export function StoryPoints({ value, onSave, className }: StoryPointsProps) {
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState<number | null>(value ?? null);
  const [loading, setLoading] = useState(false);

  const index = current !== null ? STORY_POINTS.indexOf(current) : -1;

  const increase = () => {
    if (index < STORY_POINTS.length - 1) {
      setCurrent(STORY_POINTS[index + 1]);
    }
  };

  const decrease = () => {
    if (index > 0) {
      setCurrent(STORY_POINTS[index - 1]);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    await onSave(current);
    setLoading(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setCurrent(value ?? null);
    setEditing(false);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs text-muted-foreground",
        className // ✅ applied here
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {!editing ? (
        <button
          onClick={() => setEditing(true)}
          className={
            value !== null && value !== undefined
              ? "px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[11px] font-bold hover:bg-blue-200"
              : "px-1 rounded hover:bg-muted font-mono"
          }
        >
          {value ?? "_"}
        </button>
      ) : (
        <div className="flex items-center gap-1 bg-muted rounded px-1">
          <button onClick={increase} className="hover:text-foreground">
            <ChevronUp size={14} />
          </button>

          <span
            className={
              current !== null
                ? "min-w-[20px] px-1.5 py-0.5 text-center text-[11px] font-bold rounded bg-blue-100 text-blue-700"
                : "min-w-[16px] text-center font-mono"
            }
          >
            {current ?? "_"}
          </span>

          <button onClick={decrease} className="hover:text-foreground">
            <ChevronDown size={14} />
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="text-green-600 hover:text-green-700"
          >
            <Check size={14} />
          </button>

          <button
            onClick={handleCancel}
            className="text-red-600 hover:text-red-700"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
