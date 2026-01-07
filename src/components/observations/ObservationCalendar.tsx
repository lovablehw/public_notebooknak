import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { hu } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ChevronLeft, ChevronRight, Plus, Smile, Zap, Moon, Brain, Activity, StickyNote, Loader2, X, CalendarDays
} from "lucide-react";
import { Observation, ObservationCategory, OBSERVATION_CATEGORIES } from "@/hooks/useObservations";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface ObservationCalendarProps {
  observations: Observation[];
  loading: boolean;
  onAddObservation: (date: string, category: ObservationCategory, value: string, note: string) => Promise<boolean>;
  getCategoryLabel: (value: ObservationCategory) => string;
}

const categoryConfig: Record<string, { icon: LucideIcon; bgColor: string; borderColor: string; iconColor: string }> = {
  mood: { icon: Smile, bgColor: "bg-yellow-100", borderColor: "border-yellow-400", iconColor: "text-yellow-600" },
  energy: { icon: Zap, bgColor: "bg-orange-100", borderColor: "border-orange-400", iconColor: "text-orange-600" },
  sleep: { icon: Moon, bgColor: "bg-indigo-100", borderColor: "border-indigo-400", iconColor: "text-indigo-600" },
  headache: { icon: Brain, bgColor: "bg-red-100", borderColor: "border-red-400", iconColor: "text-red-600" },
  pain: { icon: Activity, bgColor: "bg-rose-100", borderColor: "border-rose-400", iconColor: "text-rose-600" },
  note: { icon: StickyNote, bgColor: "bg-slate-100", borderColor: "border-slate-400", iconColor: "text-slate-600" },
};

const WEEKDAYS = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];

export function ObservationCalendar({ observations, loading, onAddObservation, getCategoryLabel }: ObservationCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addingForDate, setAddingForDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  
  // Form state
  const [observationCategory, setObservationCategory] = useState<ObservationCategory>("mood");
  const [observationValue, setObservationValue] = useState("");
  const [observationNote, setObservationNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group observations by date
  const observationsByDate = useMemo(() => {
    const grouped: Record<string, Observation[]> = {};
    observations.forEach((obs) => {
      const dateKey = obs.date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(obs);
    });
    return grouped;
  }, [observations]);

  // Calculate days to display
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handlePreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  const handleAddClick = (day: Date, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAddingForDate(format(day, "yyyy-MM-dd"));
    setObservationCategory("mood");
    setObservationValue("");
    setObservationNote("");
    setIsAddDialogOpen(true);
  };

  const handleSubmitObservation = async () => {
    if (!observationValue.trim() && !observationNote.trim()) return;
    
    setIsSubmitting(true);
    const success = await onAddObservation(addingForDate, observationCategory, observationValue.trim(), observationNote.trim());
    setIsSubmitting(false);
    
    if (success) {
      setIsAddDialogOpen(false);
      setObservationValue("");
      setObservationNote("");
    }
  };

  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const selectedDayObservations = selectedDateStr ? observationsByDate[selectedDateStr] || [] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-foreground flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          {format(currentMonth, "yyyy. MMMM", { locale: hu })}
        </h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handlePreviousMonth} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-border rounded-lg overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-muted/50">
          {WEEKDAYS.map((day) => (
            <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayObservations = observationsByDate[dateStr] || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const observationCount = dayObservations.length;

            return (
              <div
                key={idx}
                onClick={() => handleDayClick(day)}
                className={cn(
                  "min-h-[60px] sm:min-h-[80px] border-t border-r border-border p-1 cursor-pointer transition-colors relative group",
                  !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                  isCurrentMonth && "hover:bg-accent/50",
                  isToday && "bg-primary/5",
                  isSelected && "bg-primary/10 ring-1 ring-primary ring-inset",
                  idx % 7 === 0 && "border-l-0",
                )}
              >
                <div className="flex items-start justify-between">
                  <span className={cn(
                    "text-xs sm:text-sm font-medium",
                    isToday && "text-primary font-bold",
                    !isCurrentMonth && "text-muted-foreground/50"
                  )}>
                    {format(day, "d")}
                  </span>
                  
                  {/* Add button - visible on hover */}
                  <button
                    onClick={(e) => handleAddClick(day, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center"
                    title="Megfigyelés hozzáadása"
                  >
                    <Plus className="h-3 w-3 text-primary" />
                  </button>
                </div>

                {/* Observation indicators */}
                {observationCount > 0 && (
                  <div className="mt-1 flex flex-wrap gap-0.5">
                    {dayObservations.slice(0, 3).map((obs, i) => {
                      const config = categoryConfig[obs.category] || categoryConfig.note;
                      return (
                        <div
                          key={i}
                          className={cn(
                            "w-2 h-2 rounded-full",
                            config.bgColor,
                            "border",
                            config.borderColor
                          )}
                          title={getCategoryLabel(obs.category)}
                        />
                      );
                    })}
                    {observationCount > 3 && (
                      <span className="text-[10px] text-muted-foreground">+{observationCount - 3}</span>
                    )}
                  </div>
                )}

                {/* Observation count badge for mobile */}
                {observationCount > 0 && (
                  <div className="absolute bottom-1 right-1 sm:hidden">
                    <span className="text-[10px] bg-primary/10 text-primary px-1 rounded">
                      {observationCount}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDate && (
        <Card className="border-0 shadow-sm bg-accent/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {format(selectedDate, "yyyy. MMMM d., EEEE", { locale: hu })}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleAddClick(selectedDate)}
                  className="gap-1"
                >
                  <Plus className="h-3 w-3" />
                  <span className="hidden sm:inline">Hozzáadás</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSelectedDate(null)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedDayObservations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Ezen a napon nincs megfigyelésed.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedDayObservations
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((obs) => {
                    const config = categoryConfig[obs.category] || categoryConfig.note;
                    const IconComponent = config.icon;
                    return (
                      <div key={obs.id} className="flex items-start gap-3 p-3 bg-background rounded-lg border border-border/50">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                          config.bgColor,
                          "border",
                          config.borderColor
                        )}>
                          <IconComponent className={cn("h-4 w-4", config.iconColor)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline">{getCategoryLabel(obs.category)}</Badge>
                            {obs.value && <span className="font-medium text-foreground">{obs.value}</span>}
                          </div>
                          {obs.note && (
                            <p className="text-sm text-muted-foreground mt-1">{obs.note}</p>
                          )}
                          <span className="text-xs text-muted-foreground mt-1 block">
                            {format(new Date(obs.createdAt), "HH:mm")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Observation Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Megfigyelés hozzáadása
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Dátum: <span className="font-medium text-foreground">{format(new Date(addingForDate), "yyyy. MMMM d.", { locale: hu })}</span>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dialog-category">Kategória</Label>
              <Select value={observationCategory} onValueChange={(v) => setObservationCategory(v as ObservationCategory)}>
                <SelectTrigger id="dialog-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OBSERVATION_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialog-value">Érték</Label>
              <Input 
                id="dialog-value" 
                placeholder="pl. 7/10, jó, fáradt..." 
                value={observationValue} 
                onChange={(e) => setObservationValue(e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialog-note">Jegyzet (opcionális)</Label>
              <Textarea 
                id="dialog-note" 
                placeholder="Bővebb megjegyzések..." 
                value={observationNote} 
                onChange={(e) => setObservationNote(e.target.value)} 
                rows={3} 
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Mégse
              </Button>
              <Button 
                onClick={handleSubmitObservation} 
                disabled={isSubmitting || (!observationValue.trim() && !observationNote.trim())}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Mentés
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick add button for mobile when no date selected */}
      {!selectedDate && (
        <Button 
          onClick={() => handleAddClick(new Date())}
          className="w-full sm:hidden gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          Megfigyelés hozzáadása mára
        </Button>
      )}
    </div>
  );
}
