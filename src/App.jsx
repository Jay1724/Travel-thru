import React, { useState, useRef, useEffect } from "react";
import {
  Plane, BedDouble, Car, MapPin, Calendar, Users,
  Sparkles, ArrowRight, Loader2, Clock, Star,
  ChevronRight, Wallet, X,
} from "lucide-react";
import { DayPicker } from "react-day-picker";
import { format, differenceInCalendarDays, addDays } from "date-fns";
import "react-day-picker/style.css";

// ─────────────────────────────────────────────────────────────
// WanderZA — AI trip planner MVP
// ─────────────────────────────────────────────────────────────

const ZAR = (n) => "R" + n.toLocaleString("en-ZA");

const fmt = (d) => format(d, "d MMM");
const fmtFull = (d) => format(d, "d MMM yyyy");

function mockFlights(destination, pax) {
  const base = 1450 + (destination.length * 37) % 900;
  return [
    { id: "f1", airline: "FlySafair", dep: "06:15", arr: "08:05", stops: 0, price: base, dur: "1h50", logo: "FA" },
    { id: "f2", airline: "Airlink", dep: "11:40", arr: "13:35", stops: 0, price: base + 410, dur: "1h55", logo: "AL" },
    { id: "f3", airline: "SAA", dep: "17:20", arr: "19:25", stops: 0, price: base + 880, dur: "2h05", logo: "SA" },
  ].map((f) => ({ ...f, total: f.price * pax }));
}

function mockStays(destination) {
  return [
    { id: "s1", name: `The ${destination} Loft`, src: "Airbnb", rating: 4.92, reviews: 218, night: 980, img: "from-amber-200 to-rose-200" },
    { id: "s2", name: `Harbour View Suites`, src: "Booking.com", rating: 4.6, reviews: 1204, night: 1340, img: "from-sky-200 to-indigo-200" },
    { id: "s3", name: `Old Town Guesthouse`, src: "Booking.com", rating: 4.4, reviews: 642, night: 720, img: "from-emerald-200 to-teal-200" },
  ];
}

function mockCars(destination) {
  return [
    { id: "c1", co: "Avis", model: "VW Polo Vivo", type: "Compact", day: 420, img: "🚗" },
    { id: "c2", co: "Hertz", model: "Toyota Corolla", type: "Sedan", day: 560, img: "🚙" },
    { id: "c3", co: "Europcar", model: "Toyota Fortuner", type: "SUV", day: 1180, img: "🚐" },
  ];
}

const SUGGESTIONS = ["Cape Town", "Durban", "Mauritius", "Zanzibar", "Plettenberg Bay", "Kruger"];
const today = new Date();
today.setHours(0, 0, 0, 0);

export default function App() {
  const [stage, setStage] = useState("ask");
  const [destination, setDestination] = useState("");
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
  const [showCal, setShowCal] = useState(false);
  const [pax, setPax] = useState(2);
  const [itinerary, setItinerary] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("itinerary");
  const [picks, setPicks] = useState({ flight: "f1", stay: "s1", car: "c1" });
  const calRef = useRef(null);

  const days = dateRange.from && dateRange.to
    ? Math.max(1, differenceInCalendarDays(dateRange.to, dateRange.from))
    : 0;

  const dateLabel = dateRange.from && dateRange.to
    ? `${fmt(dateRange.from)} – ${fmt(dateRange.to)}`
    : null;

  const canPlan = destination.trim() && dateRange.from && dateRange.to;

  // Close calendar on outside click
  useEffect(() => {
    if (!showCal) return;
    function handler(e) {
      if (calRef.current && !calRef.current.contains(e.target)) setShowCal(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showCal]);

  const flights = destination ? mockFlights(destination, pax) : [];
  const stays = destination ? mockStays(destination) : [];
  const cars = destination ? mockCars(destination) : [];

  const flight = flights.find((f) => f.id === picks.flight);
  const stay = stays.find((s) => s.id === picks.stay);
  const car = cars.find((c) => c.id === picks.car);
  const tripTotal =
    (flight?.total || 0) + (stay ? stay.night * days : 0) + (car ? car.day * days : 0);

  function resetTrip() {
    setStage("ask");
    setItinerary(null);
    setDateRange({ from: undefined, to: undefined });
  }

  async function plan() {
    if (!canPlan) return;
    setStage("planning");
    setError("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `You are a South African travel planner. Build a ${days}-day itinerary for ${pax} traveller(s) visiting ${destination} from ${fmtFull(dateRange.from)} to ${fmtFull(dateRange.to)}. Respond ONLY with valid JSON, no markdown, no preamble. Schema:
{"summary":"one vivid sentence","days":[{"day":1,"title":"short title","items":[{"time":"Morning","activity":"name","note":"1 short tip"}]}]}
Give 3 items per day (Morning/Afternoon/Evening). Keep notes under 12 words. Be specific to ${destination}.`,
            },
          ],
        }),
      });
      const data = await res.json();
      const text = data.content.filter((b) => b.type === "text").map((b) => b.text).join("");
      const clean = text.replace(/```json|```/g, "").trim();
      setItinerary(JSON.parse(clean));
      setStage("results");
    } catch (e) {
      setError("Couldn't generate the itinerary. Try again.");
      setStage("ask");
    }
  }

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif" }} className="min-h-screen bg-[#0c1410] text-[#f4f1e8]">
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,900&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 grid place-items-center">
            <Plane size={18} className="text-[#0c1410]" />
          </div>
          <span style={{ fontFamily: "'Fraunces', serif" }} className="text-xl font-black tracking-tight">
            Wander<span className="text-amber-400">ZA</span>
          </span>
        </div>
        {stage === "results" && (
          <button onClick={resetTrip} className="text-sm text-white/50 hover:text-white">
            Start over
          </button>
        )}
      </header>

      {/* ── ASK STAGE ── */}
      {stage === "ask" && (
        <div className="max-w-2xl mx-auto px-6 pt-20 pb-32 text-center">
          <p className="text-amber-400 text-sm tracking-[0.3em] uppercase mb-4">Plan it once. Book it all.</p>
          <h1 style={{ fontFamily: "'Fraunces', serif" }} className="text-5xl md:text-6xl font-black leading-[1.05] mb-8">
            Where do you<br />want to go?
          </h1>

          {/* Destination input */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-2 flex items-center gap-2 mb-4 focus-within:border-amber-400/60 transition">
            <MapPin size={20} className="ml-3 text-amber-400 shrink-0" />
            <input
              autoFocus
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && plan()}
              placeholder="Cape Town, Zanzibar, Kruger…"
              className="flex-1 bg-transparent py-3 outline-none placeholder:text-white/30 text-lg"
            />
          </div>

          {/* Suggestions */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setDestination(s)}
                className={`text-sm px-3 py-1.5 rounded-full border transition ${
                  destination === s
                    ? "bg-amber-400 text-[#0c1410] border-amber-400"
                    : "border-white/15 text-white/60 hover:border-white/40"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Controls row */}
          <div className="flex gap-3 justify-center flex-wrap mb-8">

            {/* Date range picker */}
            <div ref={calRef} className="relative">
              <button
                onClick={() => setShowCal((v) => !v)}
                className={`bg-white/5 border rounded-xl px-4 py-3 flex items-center gap-3 transition hover:border-white/30 ${
                  showCal ? "border-amber-400/60" : "border-white/10"
                }`}
              >
                <Calendar size={18} className="text-amber-400 shrink-0" />
                <div className="text-left">
                  <div className="text-[11px] text-white/40 uppercase tracking-wide">Dates</div>
                  <div className={`text-sm font-semibold ${dateLabel ? "" : "text-white/40"}`}>
                    {dateLabel ?? "Pick dates"}
                    {days > 0 && (
                      <span className="ml-1.5 text-amber-400/80 font-normal text-xs">
                        · {days}d
                      </span>
                    )}
                  </div>
                </div>
                {dateLabel && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDateRange({ from: undefined, to: undefined }); }}
                    className="ml-1 text-white/30 hover:text-white/70"
                  >
                    <X size={14} />
                  </button>
                )}
              </button>

              {showCal && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 wanderza-cal bg-[#182316] border border-white/10 rounded-2xl p-4 shadow-2xl">
                  <DayPicker
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => {
                      setDateRange(range ?? { from: undefined, to: undefined });
                      if (range?.from && range?.to) setShowCal(false);
                    }}
                    disabled={{ before: today }}
                    defaultMonth={today}
                    numberOfMonths={2}
                    showOutsideDays={false}
                  />
                </div>
              )}
            </div>

            {/* Travellers stepper */}
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
              <Users size={18} className="text-amber-400" />
              <div className="text-left">
                <div className="text-[11px] text-white/40 uppercase tracking-wide">Travellers</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPax(Math.max(1, pax - 1))} className="w-5 h-5 rounded bg-white/10 leading-none">−</button>
                  <span className="w-5 text-center font-semibold">{pax}</span>
                  <button onClick={() => setPax(pax + 1)} className="w-5 h-5 rounded bg-white/10 leading-none">+</button>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={plan}
            disabled={!canPlan}
            className="group inline-flex items-center gap-2 bg-amber-400 disabled:opacity-30 text-[#0c1410] font-semibold px-8 py-4 rounded-full hover:bg-amber-300 transition"
          >
            <Sparkles size={18} /> Plan my trip
            <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
          </button>
          {error && <p className="text-rose-400 text-sm mt-4">{error}</p>}
        </div>
      )}

      {/* ── PLANNING STAGE ── */}
      {stage === "planning" && (
        <div className="max-w-2xl mx-auto px-6 pt-32 text-center">
          <Loader2 size={40} className="animate-spin text-amber-400 mx-auto mb-6" />
          <h2 style={{ fontFamily: "'Fraunces', serif" }} className="text-3xl font-bold mb-2">
            Designing your {destination} trip…
          </h2>
          <p className="text-white/50">
            {dateLabel} · {days} days · sourcing flights, stays & cars
          </p>
        </div>
      )}

      {/* ── RESULTS STAGE ── */}
      {stage === "results" && itinerary && (
        <div className="max-w-5xl mx-auto px-6 py-8 grid lg:grid-cols-[1fr_320px] gap-8">
          <div>
            <div className="flex gap-2 mb-6 border-b border-white/10">
              {[["itinerary", "Itinerary"], ["flights", "Flights"], ["stays", "Stays"], ["cars", "Cars"]].map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition ${
                    tab === k
                      ? "border-amber-400 text-amber-400"
                      : "border-transparent text-white/50 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "itinerary" && (
              <div>
                <p style={{ fontFamily: "'Fraunces', serif" }} className="text-2xl mb-6 text-white/90 italic">
                  "{itinerary.summary}"
                </p>
                <div className="space-y-5">
                  {itinerary.days.map((d, idx) => {
                    const dayDate = dateRange.from ? addDays(dateRange.from, idx) : null;
                    return (
                      <div key={d.day} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="w-8 h-8 rounded-full bg-amber-400 text-[#0c1410] grid place-items-center font-bold text-sm">
                            {d.day}
                          </span>
                          <div>
                            <h3 className="font-semibold text-lg leading-tight">{d.title}</h3>
                            {dayDate && (
                              <p className="text-xs text-white/40">{format(dayDate, "EEEE, d MMM")}</p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-3">
                          {d.items.map((it, i) => (
                            <div key={i} className="flex gap-3 pl-2">
                              <div className="text-xs text-amber-400/80 w-16 shrink-0 pt-0.5 flex items-center gap-1">
                                <Clock size={11} />{it.time}
                              </div>
                              <div>
                                <div className="font-medium text-sm">{it.activity}</div>
                                <div className="text-white/40 text-xs">{it.note}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === "flights" && (
              <div className="space-y-3">
                {flights.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setPicks({ ...picks, flight: f.id })}
                    className={`w-full text-left bg-white/5 border rounded-xl p-4 flex items-center gap-4 transition ${
                      picks.flight === f.id ? "border-amber-400" : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/10 grid place-items-center font-bold text-xs">
                      {f.logo}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{f.airline}</div>
                      <div className="text-white/50 text-sm">
                        {f.dep} → {f.arr} · {f.dur} · {f.stops === 0 ? "Direct" : f.stops + " stop"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{ZAR(f.total)}</div>
                      <div className="text-white/40 text-xs">{pax} pax</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {tab === "stays" && (
              <div className="grid sm:grid-cols-2 gap-4">
                {stays.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setPicks({ ...picks, stay: s.id })}
                    className={`text-left bg-white/5 border rounded-xl overflow-hidden transition ${
                      picks.stay === s.id ? "border-amber-400" : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className={`h-28 bg-gradient-to-br ${s.img}`} />
                    <div className="p-4">
                      <div className="flex justify-between items-start gap-2">
                        <div className="font-medium text-sm">{s.name}</div>
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded shrink-0">{s.src}</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400 text-xs mt-1">
                        <Star size={11} fill="currentColor" />{s.rating}{" "}
                        <span className="text-white/40">({s.reviews})</span>
                      </div>
                      <div className="mt-2 font-bold">
                        {ZAR(s.night)}<span className="text-white/40 text-xs font-normal"> /night</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {tab === "cars" && (
              <div className="space-y-3">
                {cars.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setPicks({ ...picks, car: c.id })}
                    className={`w-full text-left bg-white/5 border rounded-xl p-4 flex items-center gap-4 transition ${
                      picks.car === c.id ? "border-amber-400" : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="text-2xl">{c.img}</div>
                    <div className="flex-1">
                      <div className="font-medium">{c.model}</div>
                      <div className="text-white/50 text-sm">{c.co} · {c.type}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{ZAR(c.day)}</div>
                      <div className="text-white/40 text-xs">/day</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Booking summary rail */}
          <aside className="lg:sticky lg:top-6 h-fit bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 style={{ fontFamily: "'Fraunces', serif" }} className="text-xl font-bold mb-1">{destination}</h3>
            <div className="text-white/40 text-sm mb-5 space-y-0.5">
              {dateLabel && <p>{dateLabel}</p>}
              <p>{days} nights · {pax} traveller{pax !== 1 ? "s" : ""}</p>
            </div>
            <div className="space-y-3 text-sm">
              <Row icon={<Plane size={15} />} label={flight?.airline} val={ZAR(flight?.total || 0)} />
              <Row icon={<BedDouble size={15} />} label={`${stay?.name} ×${days}`} val={ZAR((stay?.night || 0) * days)} />
              <Row icon={<Car size={15} />} label={`${car?.model} ×${days}`} val={ZAR((car?.day || 0) * days)} />
            </div>
            <div className="border-t border-white/10 mt-4 pt-4 flex justify-between items-center">
              <span className="flex items-center gap-1 text-white/60 text-sm">
                <Wallet size={15} /> Total
              </span>
              <span style={{ fontFamily: "'Fraunces', serif" }} className="text-2xl font-black text-amber-400">
                {ZAR(tripTotal)}
              </span>
            </div>
            <button className="w-full mt-4 bg-amber-400 text-[#0c1410] font-semibold py-3 rounded-full hover:bg-amber-300 transition flex items-center justify-center gap-2">
              Book all <ChevronRight size={16} />
            </button>
            <p className="text-white/30 text-[11px] text-center mt-3">Demo — booking routes to partner checkout</p>
          </aside>
        </div>
      )}
    </div>
  );
}

function Row({ icon, label, val }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="flex items-center gap-2 text-white/60">
        <span className="text-amber-400">{icon}</span>{label}
      </span>
      <span className="font-medium shrink-0">{val}</span>
    </div>
  );
}
