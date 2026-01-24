import { useState } from "react";
import { 
  ChallengeObservationCategory, 
  CHALLENGE_OBSERVATION_CATEGORIES 
} from "@/hooks/useChallenges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Cigarette, Scale, ThumbsUp, ThumbsDown } from "lucide-react";
import { format } from "date-fns";

interface ObservationLoggerProps {
  requiredCategories: string[];
  onLog: (
    category: string,
    value: string,
    numericValue?: number,
    note?: string,
    observationDate?: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export function ObservationLogger({ requiredCategories, onLog }: ObservationLoggerProps) {
  const [category, setCategory] = useState<string>(requiredCategories[0] || "cigarette_count");
  const [value, setValue] = useState<string>("");
  const [numericValue, setNumericValue] = useState<number>(0);
  const [scaleValue, setScaleValue] = useState<number>(5);
  const [note, setNote] = useState<string>("");
  const [observationDate, setObservationDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);

  // Smoking-specific state
  const [resistedLighting, setResistedLighting] = useState<boolean | null>(null);
  const [showCigaretteCount, setShowCigaretteCount] = useState(false);

  const isSmokingChallenge = requiredCategories.includes("cigarette_count");

  // Get available categories (filter to required ones if specified)
  const availableCategories = CHALLENGE_OBSERVATION_CATEGORIES.filter(
    cat => requiredCategories.length === 0 || requiredCategories.includes(cat.value)
  );

  const selectedCategory = availableCategories.find(c => c.value === category);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // For smoking challenge, log resisted status first if applicable
    if (isSmokingChallenge && resistedLighting !== null) {
      await onLog(
        "resisted_lighting",
        resistedLighting ? "yes" : "no",
        resistedLighting ? 1 : 0,
        note || undefined,
        observationDate
      );
    }

    let finalValue = value;
    let finalNumeric: number | undefined;

    if (selectedCategory?.type === "numeric") {
      finalValue = numericValue.toString();
      finalNumeric = numericValue;
    } else if (selectedCategory?.type === "scale") {
      finalValue = scaleValue.toString();
      finalNumeric = scaleValue;
    }

    // Only log cigarette count if explicitly enabled or if it's a non-smoking category
    if (!isSmokingChallenge || showCigaretteCount || category !== "cigarette_count") {
      const result = await onLog(category, finalValue, finalNumeric, note || undefined, observationDate);

      if (result.success) {
        // Reset form
        setValue("");
        setNumericValue(0);
        setScaleValue(5);
        setNote("");
        setResistedLighting(null);
        setShowCigaretteCount(false);
      }
    } else if (isSmokingChallenge && resistedLighting !== null) {
      // Reset form if only resisted status was logged
      setNote("");
      setResistedLighting(null);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Date picker */}
        <div className="space-y-2">
          <Label htmlFor="observation-date">Dátum</Label>
          <Input
            id="observation-date"
            type="date"
            value={observationDate}
            onChange={(e) => setObservationDate(e.target.value)}
            max={format(new Date(), "yyyy-MM-dd")}
          />
        </div>

        {/* Category selector - hide for smoking if only cigarette count */}
        {(!isSmokingChallenge || availableCategories.length > 1) && (
          <div className="space-y-2">
            <Label>Kategória</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center gap-2">
                      {cat.value === "cigarette_count" && <Cigarette className="h-4 w-4" />}
                      {cat.value === "weight" && <Scale className="h-4 w-4" />}
                      {cat.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Smoking-specific dual input */}
      {isSmokingChallenge && (
        <Card className="border-primary/20 bg-primary/5 max-w-full overflow-hidden">
          <CardContent className="pt-4 space-y-4 px-3 sm:px-6">
            <Label className="text-base font-medium flex items-center gap-2">
              <Cigarette className="h-5 w-5 text-primary" />
              Dohányzás naplózás
            </Label>

            {/* Resisted lighting checkbox */}
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Ellenálltál a rágyújtás vágyának?</p>
              {/* Responsive button container - stack on mobile, side by side on larger screens */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <Button
                  type="button"
                  variant={resistedLighting === true ? "default" : "outline"}
                  size="sm"
                  className="gap-2 w-full sm:flex-1 min-w-0"
                  onClick={() => setResistedLighting(true)}
                >
                  <ThumbsUp className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Igen, ellenálltam</span>
                </Button>
                <Button
                  type="button"
                  variant={resistedLighting === false ? "destructive" : "outline"}
                  size="sm"
                  className="gap-2 w-full sm:flex-1 min-w-0"
                  onClick={() => setResistedLighting(false)}
                >
                  <ThumbsDown className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Nem sikerült</span>
                </Button>
              </div>
            </div>

            {/* Show cigarette count option */}
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="show-count"
                checked={showCigaretteCount}
                onCheckedChange={(checked) => setShowCigaretteCount(checked === true)}
              />
              <Label htmlFor="show-count" className="text-sm cursor-pointer">
                Cigaretták számának rögzítése
              </Label>
            </div>

            {/* Cigarette count input */}
            {showCigaretteCount && (
              <div className="space-y-2 animate-fade-in">
                <Label>Ma elszívott cigaretták száma</Label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setNumericValue(Math.max(0, numericValue - 1))}
                    disabled={numericValue <= 0}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    value={numericValue}
                    onChange={(e) => setNumericValue(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-24 text-center text-lg font-semibold"
                    min={0}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setNumericValue(numericValue + 1)}
                  >
                    +
                  </Button>
                  {numericValue === 0 && (
                    <span className="text-green-500 text-sm font-medium">
                      🎉 Füstmentes nap!
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Non-smoking value input based on type */}
      {(!isSmokingChallenge || category !== "cigarette_count") && (
        <div className="space-y-2">
          <Label>
            {selectedCategory?.label || "Érték"}
            {selectedCategory?.type === "numeric" && category === "weight" && " (kg)"}
          </Label>
          
          {selectedCategory?.type === "numeric" && category !== "cigarette_count" && (
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setNumericValue(Math.max(0, numericValue - 1))}
                disabled={numericValue <= 0}
              >
                -
              </Button>
              <Input
                type="number"
                value={numericValue}
                onChange={(e) => setNumericValue(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-24 text-center text-lg font-semibold"
                min={0}
                step={category === "weight" ? 0.1 : 1}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setNumericValue(numericValue + 1)}
              >
                +
              </Button>
            </div>
          )}

          {selectedCategory?.type === "scale" && (
            <div className="space-y-3">
              <Slider
                value={[scaleValue]}
                onValueChange={([v]) => setScaleValue(v)}
                min={selectedCategory.min || 1}
                max={selectedCategory.max || 10}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Alacsony ({selectedCategory.min || 1})</span>
                <span className="font-medium text-foreground">{scaleValue}</span>
                <span>Magas ({selectedCategory.max || 10})</span>
              </div>
            </div>
          )}

          {selectedCategory?.type === "text" && (
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Írd le a megfigyelésedet..."
              rows={3}
            />
          )}
        </div>
      )}

      {/* Optional note */}
      <div className="space-y-2">
        <Label htmlFor="observation-note">Megjegyzés (opcionális)</Label>
        <Input
          id="observation-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Pl. reggeli mérés, stresszes nap..."
        />
      </div>

      {/* Submit button */}
      <Button 
        type="submit" 
        disabled={loading || (isSmokingChallenge && resistedLighting === null && !showCigaretteCount)} 
        className="w-full gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Megfigyelés rögzítése
      </Button>
    </form>
  );
}
