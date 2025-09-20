"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Search,
  X,
  MapPin,
  Navigation,
  Calendar as CalendarIcon,
  Clock,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

type RecentSearch = {
  id: number;
  title: string;
  subtitle?: string;
  emoji?: string;
};

type Suggested = {
  id: number;
  title: string;
  subtitle?: string;
  icon?: "nearby" | "city" | "park" | "place";
};

export interface MobileSearchOverlayProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (params: {
    location?: string;
    service?: string;
    date?: string; // ISO date with optional time HH:mm
    duration?: string; // e.g., 1hr
  }) => void;
  initialLocation?: string;
  initialService?: string;
  initialDate?: string;
  initialDuration?: string;
}

const DEFAULT_RECENTS: RecentSearch[] = [
  {
    id: 1,
    title: "Luxury Spa in Bandra",
    subtitle: "Full body massage · Today · 2 hrs",
    emoji: "🧘‍♀️",
  },
  {
    id: 2,
    title: "Hair salon near me",
    subtitle: "Haircut & styling · Tomorrow · 1 hr",
    emoji: "✂️",
  },
  {
    id: 3,
    title: "Massage therapy Mumbai",
    subtitle: "Deep tissue massage · Last week",
    emoji: "💆‍♀️",
  },
  {
    id: 4,
    title: "Facial treatment Andheri",
    subtitle: "Anti-aging facial · Last month",
    emoji: "✨",
  },
];

const DEFAULT_SUGGESTED: Suggested[] = [
  {
    id: 1,
    title: "Use current location",
    subtitle: "Automatic location detection",
    icon: "nearby",
  },
  {
    id: 2,
    title: "Mumbai, Maharashtra",
    subtitle: "1200+ spas & salons",
    icon: "city",
  },
  {
    id: 3,
    title: "Delhi, Delhi NCR",
    subtitle: "980+ spas & salons",
    icon: "city",
  },
  {
    id: 4,
    title: "Bangalore, Karnataka",
    subtitle: "760+ spas & salons",
    icon: "city",
  },
  {
    id: 5,
    title: "Hyderabad, Telangana",
    subtitle: "540+ spas & salons",
    icon: "city",
  },
  {
    id: 6,
    title: "Chennai, Tamil Nadu",
    subtitle: "620+ spas & salons",
    icon: "city",
  },
];

export default function MobileSearchOverlay({
  open,
  onClose,
  onSubmit,
  initialLocation = "",
  initialService = "",
  initialDate = "",
  initialDuration = "",
}: MobileSearchOverlayProps) {
  const [location, setLocation] = useState(initialLocation);
  const [service, setService] = useState<string>(initialService);
  const [dateISO, setDateISO] = useState<string>(initialDate);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialDate ? new Date(initialDate) : undefined,
  );
  const [duration, setDuration] = useState<string>(initialDuration);
  const [activeSection, setActiveSection] = useState<
    "" | "service" | "when" | "duration"
  >("");

  // Lock scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const canSubmit = useMemo(
    () => location.trim().length > 0 || service.trim().length > 0,
    [location, service],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="absolute inset-x-0 top-0 bottom-0 bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl">
        {/* Top actions + tabs */}
        <div className="px-3 pt-4 pb-3 sticky top-0 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 z-10">
          <div className="relative h-12">
            {/* Centered tabs */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-4">
                <Tab icon="🏠" label="Homes" active />
                <Tab icon="🎈" label="Experiences" isNew />
                <Tab icon="🛎️" label="Services" isNew />
              </div>
            </div>
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-10 w-10 absolute right-2 top-1/2 -translate-y-1/2 bg-white border border-gray-300 shadow-md hover:bg-gray-100 text-gray-800 focus-visible:ring-2 focus-visible:ring-coral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white z-20"
              onClick={onClose}
              aria-label="Close search"
            >
              <X className="h-6 w-6" strokeWidth={2.5} />
            </Button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="absolute inset-x-0 top-[76px] bottom-[88px] overflow-y-auto px-4">
          {/* Where card */}
          <div className="mt-2 mb-4 rounded-3xl shadow-md border border-gray-200 p-4">
            <div className="text-2xl font-bold mb-3">Where?</div>
            <div className="mb-3">
              <div className="flex items-center gap-3 rounded-xl border border-gray-300 px-3 py-3">
                <Search className="h-5 w-5 text-gray-500" />
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Search for city, location or salon"
                  className="border-0 p-0 focus-visible:ring-0"
                />
              </div>
            </div>

            {/* Recent searches */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-gray-500 mb-2">
                Recent searches
              </div>
              <div className="space-y-1">
                {DEFAULT_RECENTS.map((r) => (
                  <button
                    key={r.id}
                    className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-gray-50 text-left"
                    onClick={() => setLocation(r.title)}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-2xl">
                      <span>{r.emoji ?? "🏡"}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {r.title}
                      </div>
                      {r.subtitle && (
                        <div className="text-xs text-gray-500">
                          {r.subtitle}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Suggested destinations */}
            <div className="mb-1">
              <div className="text-xs font-semibold text-gray-500 mb-2">
                Suggested destinations
              </div>
              <div className="space-y-1">
                {DEFAULT_SUGGESTED.map((s) => (
                  <button
                    key={s.id}
                    className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-gray-50 text-left"
                    onClick={() => setLocation(s.title)}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                      {s.icon === "nearby" ? (
                        <Navigation className="h-6 w-6 text-sky-600" />
                      ) : (
                        <MapPin className="h-6 w-6 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {s.title}
                      </div>
                      {s.subtitle && (
                        <div className="text-xs text-gray-500">
                          {s.subtitle}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CityScroll specific rows */}
          <div className="space-y-3">
            <Row
              label="Service"
              value={service ? service : "Spa, salon, massage"}
              icon={<span className="text-lg">✨</span>}
              onClick={() =>
                setActiveSection((s) => (s === "service" ? "" : "service"))
              }
            />
            {activeSection === "service" && (
              <div className="mt-2 mb-1 rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center gap-3 rounded-xl border border-gray-300 px-3 py-3 mb-3">
                  <Search className="h-5 w-5 text-gray-500" />
                  <Input
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    placeholder="Search services (e.g., Hair spa)"
                    className="border-0 p-0 focus-visible:ring-0"
                  />
                </div>
                <ServiceSuggestions onPick={(val) => setService(val)} />
              </div>
            )}

            <Row
              label="When"
              value={
                dateISO
                  ? new Date(dateISO).toLocaleDateString() +
                    (dateISO.split("T")[1] ? ` · ${dateISO.split("T")[1]}` : "")
                  : "Select date & time"
              }
              icon={<CalendarIcon className="h-5 w-5 text-gray-600" />}
              onClick={() =>
                setActiveSection((s) => (s === "when" ? "" : "when"))
              }
            />
            {activeSection === "when" && (
              <div className="mt-2 mb-1 rounded-2xl border border-gray-200 p-4">
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-2">
                      Choose date
                    </div>
                    <div className="flex justify-center">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date: Date | undefined) => {
                          setSelectedDate(date ?? undefined);
                          if (date) {
                            const currentTime =
                              dateISO.split("T")[1] || "10:00";
                            setDateISO(
                              `${
                                date.toISOString().split("T")[0]
                              }T${currentTime}`,
                            );
                          }
                        }}
                        disabled={(date: Date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-2">
                      Choose time
                    </div>
                    <select
                      value={dateISO.split("T")[1] || ""}
                      onChange={(e) =>
                        setDateISO(
                          `${
                            dateISO.split("T")[0] ||
                            new Date().toISOString().split("T")[0]
                          }T${e.target.value}`,
                        )
                      }
                      className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-500 hover:border-coral-300 transition-colors text-gray-700"
                    >
                      <option value="">Select time</option>
                      {[
                        "09:00",
                        "10:00",
                        "11:00",
                        "12:00",
                        "13:00",
                        "14:00",
                        "15:00",
                        "16:00",
                        "17:00",
                        "18:00",
                        "19:00",
                        "20:00",
                      ].map((t) => (
                        <option key={t} value={t}>
                          {Number(t.split(":")[0]) > 12
                            ? `${Number(t.split(":")[0]) - 12}:${
                                t.split(":")[1]
                              } PM`
                            : `${t} ${
                                Number(t.split(":")[0]) >= 12 ? "PM" : "AM"
                              }`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <Row
              label="Duration"
              value={duration ? duration.replace("hr", " hour") : "How long?"}
              icon={<Clock className="h-5 w-5 text-gray-600" />}
              onClick={() =>
                setActiveSection((s) => (s === "duration" ? "" : "duration"))
              }
            />
            {activeSection === "duration" && (
              <div className="mt-2 mb-1 rounded-2xl border border-gray-200 p-4">
                <DurationGrid value={duration} onPick={setDuration} />
              </div>
            )}
          </div>
        </div>

        {/* Bottom actions */}
        <div className="absolute left-0 right-0 bottom-0 border-t bg-white px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              className="text-gray-700 underline underline-offset-2"
              onClick={() => {
                setLocation("");
                setService("");
                setDateISO("");
                setSelectedDate(undefined);
                setDuration("");
                setActiveSection("");
              }}
            >
              Clear all
            </button>
            <Button
              className={cn(
                "rounded-full px-5 h-11 flex items-center gap-2",
                !canSubmit && "opacity-50 cursor-not-allowed",
              )}
              onClick={() => {
                if (!canSubmit) return;
                onSubmit?.({
                  location,
                  service,
                  date: dateISO || undefined,
                  duration: duration || undefined,
                });
                onClose();
              }}
            >
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  icon,
  onClick,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm"
    >
      <div className="flex items-center gap-3">
        {icon}
        <div className="text-left">
          <div className="text-sm font-semibold text-gray-800">{label}</div>
          <div className="text-sm text-gray-500">{value}</div>
        </div>
      </div>
      <span className="text-gray-400">›</span>
    </button>
  );
}

function Tab({
  icon,
  label,
  active,
  isNew,
}: {
  icon: string;
  label: string;
  active?: boolean;
  isNew?: boolean;
}) {
  return (
    <div className="relative w-16 flex-shrink-0">
      <div
        className={cn(
          "flex flex-col items-center justify-center px-1 py-1.5",
          active ? "text-gray-900" : "text-gray-600",
        )}
      >
        <span className="text-[32px] leading-none">{icon}</span>
        <span className="text-[12px] leading-tight">{label}</span>
      </div>
      {isNew && (
        <span className="absolute -top-1 -right-1 bg-coral-500 text-white text-[9px] leading-none px-1 py-0.5 rounded">
          NEW
        </span>
      )}
    </div>
  );
}

// --- Helpers: suggestions and pickers ---

const serviceSuggestions = [
  {
    id: 1,
    name: "Full Body Spa",
    type: "Premium Service",
    popular: true,
    emoji: "🧘‍♀️",
  },
  {
    id: 2,
    name: "Hair Cut & Styling",
    type: "Salon Service",
    popular: true,
    emoji: "✂️",
  },
  {
    id: 3,
    name: "Deep Tissue Massage",
    type: "Massage Therapy",
    popular: true,
    emoji: "💆‍♀️",
  },
  {
    id: 4,
    name: "Anti-Aging Facial",
    type: "Skin Care",
    popular: true,
    emoji: "✨",
  },
  { id: 5, name: "Manicure & Pedicure", type: "Nail Care", emoji: "💅" },
  { id: 6, name: "Body Scrub & Polish", type: "Body Treatment", emoji: "🛀" },
  { id: 7, name: "Hair Color & Highlights", type: "Hair Service", emoji: "🎨" },
  { id: 8, name: "Bridal Makeup", type: "Beauty Service", emoji: "💄" },
  { id: 9, name: "Couples Massage", type: "Spa Package", emoji: "�" },
  { id: 10, name: "Aromatherapy", type: "Wellness", emoji: "🌸" },
];

function ServiceSuggestions({ onPick }: { onPick: (value: string) => void }) {
  return (
    <div>
      <div className="text-sm font-semibold text-gray-700 mb-2">
        Popular services
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {serviceSuggestions
          .filter((s) => s.popular)
          .map((s) => (
            <button
              key={s.id}
              onClick={() => onPick(s.name)}
              className="flex items-center gap-2 p-3 border border-gray-200 rounded-xl hover:border-coral-500 hover:bg-coral-50 text-left"
            >
              <span className="text-2xl">{s.emoji}</span>
              <div>
                <div className="text-sm font-medium text-gray-800">
                  {s.name}
                </div>
                <div className="text-xs text-gray-500">{s.type}</div>
              </div>
            </button>
          ))}
      </div>
      <div className="text-sm font-semibold text-gray-700 mb-2">
        All services
      </div>
      <div className="space-y-1">
        {serviceSuggestions.map((s) => (
          <button
            key={`all-${s.id}`}
            onClick={() => onPick(s.name)}
            className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-gray-50 text-left"
          >
            <span className="text-2xl">{s.emoji}</span>
            <div>
              <div className="text-sm font-medium text-gray-800">{s.name}</div>
              <div className="text-xs text-gray-500">{s.type}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

const durationOptions = [
  { id: 1, label: "30 minutes", value: "30min", popular: true },
  { id: 2, label: "1 hour", value: "1hr", popular: true },
  { id: 3, label: "1.5 hours", value: "1.5hr", popular: true },
  { id: 4, label: "2 hours", value: "2hr" },
  { id: 5, label: "2.5 hours", value: "2.5hr" },
  { id: 6, label: "3+ hours", value: "3hr+" },
];

function DurationGrid({
  value,
  onPick,
}: {
  value: string;
  onPick: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {durationOptions.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onPick(opt.value)}
          className={cn(
            "p-4 border border-gray-200 rounded-xl hover:border-coral-500 hover:bg-coral-50 text-left",
            value === opt.value && "border-coral-500 bg-coral-50",
          )}
        >
          <div className="text-sm font-medium text-gray-800">{opt.label}</div>
          {opt.popular && (
            <div className="text-xs text-coral-600 mt-1">Popular</div>
          )}
        </button>
      ))}
    </div>
  );
}
