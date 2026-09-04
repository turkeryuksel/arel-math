"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowDown, ArrowRight, ArrowUp, Gamepad2, RotateCcw, Sparkles, Trophy } from "lucide-react";
import { AppStorage } from "@/lib/firebase/storageProvider";

type GameId = "memory" | "symmetry" | "ocean" | "race" | "basketball" | "swimming";

const GAME_CARDS: Array<{
  id: GameId;
  title: string;
  description: string;
  icon: string;
  color: string;
}> = [
  { id: "memory", title: "Arel’in Hafıza Kartları", description: "İşlemlerle sonuçlarını buluştur, kart çiftlerini hatırla.", icon: "🧠", color: "from-violet-600 to-fuchsia-500" },
  { id: "symmetry", title: "Simetri Tasarımcısı", description: "Renkli deseni aynanın diğer tarafında tamamla.", icon: "🦋", color: "from-pink-500 to-orange-400" },
  { id: "ocean", title: "Denizaltı Labirenti", description: "Arel’i yönlendir, mercanlara takılmadan üç inciyi topla.", icon: "🤿", color: "from-cyan-500 to-blue-700" },
  { id: "race", title: "Arel’in Turbo Rotası", description: "Şerit seç, konileri aş ve yıldızları toplayarak finişe ulaş.", icon: "🏎️", color: "from-red-500 to-amber-400" },
  { id: "basketball", title: "Potanın Ritmi", description: "Güç göstergesini hedefte yakala, üç neşeli basket at.", icon: "🏀", color: "from-orange-500 to-rose-500" },
  { id: "swimming", title: "Yüzme Ritmi", description: "Kulaç ve nefes dizisini hatırla, üç havuzu tamamla.", icon: "🏊", color: "from-sky-500 to-indigo-600" },
];

function GameComplete({ title, moves, onAgain, onExit }: { title: string; moves: number; onAgain: () => void; onExit: () => void }) {
  return (
    <div className="rounded-[2rem] border border-amber-100 bg-white p-7 text-center shadow-xl sm:p-9">
      <Trophy className="mx-auto h-14 w-14 text-amber-500" />
      <h2 className="mt-3 text-2xl font-black text-slate-900">Harika oyun, Arel! 🎉</h2>
      <p className="mt-2 text-sm font-semibold text-slate-500">{title} tamamlandı · {moves} hamle · +15 XP</p>
      <p className="mt-1 text-xs font-medium text-slate-400">Burada kaybetmek yok; her tur beynini başka bir yoldan çalıştırır.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button onClick={onAgain} className="min-h-13 rounded-2xl bg-blue-600 px-5 font-black text-white">Bir Tur Daha</button>
        <button onClick={onExit} className="min-h-13 rounded-2xl bg-slate-100 px-5 font-black text-slate-700">Başka Oyun Seç</button>
      </div>
    </div>
  );
}

function shuffled<T>(items: T[], seed: number): T[] {
  const result = [...items];
  let state = seed * 9973 + 17;
  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const swapIndex = state % (index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function MemoryGame({ run, onAgain, onExit }: { run: number; onAgain: () => void; onExit: () => void }) {
  const cards = useMemo(() => {
    const base = 3 + (run % 4);
    const pairs = [
      { id: "a", left: `${base} × 2`, right: String(base * 2) },
      { id: "b", left: `${base + 2} + 7`, right: String(base + 9) },
      { id: "c", left: `${(base + 1) * 3} ÷ 3`, right: String(base + 1) },
      { id: "d", left: `${20 + base} − ${base}`, right: "20" },
      { id: "e", left: `${base + 4} × 3`, right: String((base + 4) * 3) },
      { id: "f", left: `${30 + base} − 10`, right: String(20 + base) },
    ];
    return shuffled(pairs.flatMap((pair) => [
        { key: `${pair.id}-q`, pairId: pair.id, label: pair.left },
        { key: `${pair.id}-a`, pairId: pair.id, label: pair.right },
      ]), run);
  }, [run]);
  const [open, setOpen] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [message, setMessage] = useState("İşlem ile sonucunu eşleştir. Kartların yerini aklında tut!");
  const saved = useRef(false);
  const complete = matched.size === 6;

  useEffect(() => {
    if (!complete || saved.current) return;
    saved.current = true;
    void AppStorage.recordGameResult("memory", moves);
  }, [complete, moves]);

  const flip = (key: string, pairId: string) => {
    if (open.length >= 2 || open.includes(key) || matched.has(pairId)) return;
    const next = [...open, key];
    setOpen(next);
    if (next.length !== 2) return;
    setMoves((value) => value + 1);
    const [first, second] = next.map((item) => cards.find((card) => card.key === item)!);
    if (first.pairId === second.pairId) {
      setMatched((value) => new Set(value).add(pairId));
      setMessage("Buldun! İşlem ve sonuç birbirine kavuştu ✨");
      setTimeout(() => setOpen([]), 350);
    } else {
      setMessage("Bu ikisi eşleşmedi; ama artık iki kartın yerini biliyorsun 🧠");
      setTimeout(() => setOpen([]), 850);
    }
  };

  if (complete) return <GameComplete title="Hafıza Kartları" moves={moves} onAgain={onAgain} onExit={onExit} />;
  return (
    <GameFrame title="Arel’in Hafıza Kartları" icon="🧠" subtitle={`${matched.size}/6 çift · ${moves} hamle`} onExit={onExit}>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
        {cards.map((card) => {
          const visible = open.includes(card.key) || matched.has(card.pairId);
          return (
            <button key={card.key} onClick={() => flip(card.key, card.pairId)} className={`aspect-[4/3] rounded-2xl border-2 text-base font-black transition-all sm:text-xl ${visible ? "border-violet-200 bg-violet-50 text-violet-800" : "border-indigo-500 bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-md"}`}>
              {visible ? card.label : "?"}
            </button>
          );
        })}
      </div>
      <FriendlyMessage>{message}</FriendlyMessage>
    </GameFrame>
  );
}

function SymmetryGame({ run, onAgain, onExit }: { run: number; onAgain: () => void; onExit: () => void }) {
  const target = useMemo(() => new Set([run % 12, (run * 3 + 2) % 12, (run * 5 + 5) % 12, (run * 7 + 8) % 12]), [run]);
  const [painted, setPainted] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [message, setMessage] = useState("Sol taraftaki renkleri ayna çizgisinin karşısına taşı.");
  const [complete, setComplete] = useState(false);
  const saved = useRef(false);

  useEffect(() => {
    if (!complete || saved.current) return;
    saved.current = true;
    void AppStorage.recordGameResult("symmetry", moves);
  }, [complete, moves]);

  const check = () => {
    const missing = [...target].filter((cell) => !painted.has(cell)).length;
    const extra = [...painted].filter((cell) => !target.has(cell)).length;
    if (missing === 0 && extra === 0) setComplete(true);
    else setMessage(`${missing + extra} kare daha aynadaki yerini arıyor. Desene tekrar bakabilirsin 🦋`);
  };
  if (complete) return <GameComplete title="Simetri Tasarımcısı" moves={moves} onAgain={onAgain} onExit={onExit} />;
  return (
    <GameFrame title="Simetri Tasarımcısı" icon="🦋" subtitle={`${moves} dokunuş`} onExit={onExit}>
      <div className="mx-auto grid max-w-xl grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-pink-50 p-3">
          {Array.from({ length: 12 }, (_, index) => <span key={index} className={`aspect-square rounded-lg ${target.has(index) ? "bg-gradient-to-br from-pink-400 to-orange-400" : "bg-white"}`} />)}
        </div>
        <div className="h-full w-1 rounded-full bg-violet-400 shadow-sm" />
        <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-violet-50 p-3">
          {Array.from({ length: 12 }, (_, visualIndex) => {
            const row = Math.floor(visualIndex / 3);
            const col = visualIndex % 3;
            const mirroredIndex = row * 3 + (2 - col);
            const active = painted.has(mirroredIndex);
            return <button key={visualIndex} onClick={() => { setMoves((v) => v + 1); setPainted((value) => { const next = new Set(value); if (active) next.delete(mirroredIndex); else next.add(mirroredIndex); return next; }); }} className={`aspect-square rounded-lg transition-all ${active ? "bg-gradient-to-br from-violet-500 to-blue-500 shadow-sm" : "bg-white hover:bg-violet-100"}`} aria-label={`Simetri karesi ${visualIndex + 1}`} />;
          })}
        </div>
      </div>
      <FriendlyMessage>{message}</FriendlyMessage>
      <button onClick={check} className="mt-4 min-h-13 w-full rounded-2xl bg-violet-600 font-black text-white">Aynayı Kontrol Et</button>
    </GameFrame>
  );
}

const OCEAN_OBSTACLES = new Set([2, 7, 11, 13, 17]);
const OCEAN_PEARLS = new Set([4, 10, 19]);

function OceanGame({ onAgain, onExit }: { onAgain: () => void; onExit: () => void }) {
  const [position, setPosition] = useState(20);
  const [pearls, setPearls] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [message, setMessage] = useState("Yönleri kullan, üç inciyi istediğin sırayla topla.");
  const complete = pearls.size === OCEAN_PEARLS.size;
  const saved = useRef(false);
  useEffect(() => {
    if (!complete || saved.current) return;
    saved.current = true;
    void AppStorage.recordGameResult("ocean", moves);
  }, [complete, moves]);

  const move = (rowChange: number, colChange: number) => {
    const row = Math.floor(position / 5);
    const col = position % 5;
    const nextRow = row + rowChange;
    const nextCol = col + colChange;
    if (nextRow < 0 || nextRow >= 5 || nextCol < 0 || nextCol >= 5) {
      setMessage("Okyanusun kenarına geldik; başka bir yön deneyelim 🌊");
      return;
    }
    const next = nextRow * 5 + nextCol;
    if (OCEAN_OBSTACLES.has(next)) {
      setMessage("Mercan yolu kapatıyor. Etrafından dolaşabiliriz 🪸");
      return;
    }
    setPosition(next);
    setMoves((value) => value + 1);
    if (OCEAN_PEARLS.has(next) && !pearls.has(next)) {
      setPearls((value) => new Set(value).add(next));
      setMessage("Bir inci buldun! Konumları aklında tutup diğerlerini arayalım ✨");
    } else setMessage("Güzel rota! Şimdi hangi yön bizi inciye yaklaştırır?");
  };

  if (complete) return <GameComplete title="Denizaltı Labirenti" moves={moves} onAgain={onAgain} onExit={onExit} />;
  return (
    <GameFrame title="Denizaltı Labirenti" icon="🤿" subtitle={`${pearls.size}/3 inci · ${moves} hamle`} onExit={onExit}>
      <div className="mx-auto grid max-w-sm grid-cols-5 gap-1.5 rounded-3xl bg-cyan-100 p-3">
        {Array.from({ length: 25 }, (_, index) => (
          <div key={index} className={`flex aspect-square items-center justify-center rounded-xl text-xl sm:text-2xl ${position === index ? "bg-blue-600 shadow-md" : "bg-white/70"}`}>
            {position === index ? "🤿" : OCEAN_OBSTACLES.has(index) ? "🪸" : OCEAN_PEARLS.has(index) && !pearls.has(index) ? "🫧" : pearls.has(index) ? "✨" : ""}
          </div>
        ))}
      </div>
      <FriendlyMessage>{message}</FriendlyMessage>
      <div className="mx-auto mt-4 grid w-44 grid-cols-3 gap-2">
        <span /><MoveButton label="Yukarı" onClick={() => move(-1, 0)}><ArrowUp /></MoveButton><span />
        <MoveButton label="Sol" onClick={() => move(0, -1)}><ArrowLeft /></MoveButton>
        <MoveButton label="Aşağı" onClick={() => move(1, 0)}><ArrowDown /></MoveButton>
        <MoveButton label="Sağ" onClick={() => move(0, 1)}><ArrowRight /></MoveButton>
      </div>
    </GameFrame>
  );
}

function RaceGame({ run, onAgain, onExit }: { run: number; onAgain: () => void; onExit: () => void }) {
  const course = useMemo(() => Array.from({ length: 12 }, (_, row) => ({
    obstacle: (row * 2 + run + Math.floor(row / 3)) % 3,
    star: (row + run * 2 + 1) % 3,
  })).map((item) => item.star === item.obstacle ? { ...item, star: (item.star + 1) % 3 } : item), [run]);
  const [step, setStep] = useState(0);
  const [lane, setLane] = useState(1);
  const [stars, setStars] = useState(0);
  const [moves, setMoves] = useState(0);
  const [message, setMessage] = useState("Önündeki yolu incele ve güvenli şeridi seç.");
  const saved = useRef(false);
  const complete = step >= course.length;

  useEffect(() => {
    if (!complete || saved.current) return;
    saved.current = true;
    void AppStorage.recordGameResult("race", moves);
  }, [complete, moves]);

  const drive = (nextLane: number) => {
    setMoves((value) => value + 1);
    if (course[step].obstacle === nextLane) {
      setMessage("Koniyi önceden gördün! Başka bir şerit seçip rotayı değiştirebilirsin 🚧");
      return;
    }
    setLane(nextLane);
    if (course[step].star === nextLane) {
      setStars((value) => value + 1);
      setMessage("Yıldız toplandı! İleriye bakıp yeni şeridi planla ⭐");
    } else setMessage("Temiz geçiş! Bir sonraki sırayı inceleyelim 🏁");
    setStep((value) => value + 1);
  };

  if (complete) return <GameComplete title={`Turbo Rotası · ${stars} yıldız`} moves={moves} onAgain={onAgain} onExit={onExit} />;
  const visibleRows = course.slice(step, step + 6);
  return (
    <GameFrame title="Arel’in Turbo Rotası" icon="🏎️" subtitle={`${step}/12 etap · ${stars} yıldız`} onExit={onExit}>
      <div className="mx-auto max-w-md overflow-hidden rounded-3xl border-4 border-slate-300 bg-slate-700 p-2">
        <div className="flex flex-col-reverse gap-1">
          {visibleRows.map((row, rowIndex) => (
            <div key={step + rowIndex} className="grid grid-cols-3 gap-1">
              {[0, 1, 2].map((cellLane) => (
                <div key={cellLane} className="flex h-12 items-center justify-center rounded-lg border-x border-dashed border-white/30 bg-slate-600 text-xl">
                  {rowIndex === 0 && cellLane === lane ? "🏎️" : row.obstacle === cellLane ? "🚧" : row.star === cellLane ? "⭐" : ""}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <FriendlyMessage>{message}</FriendlyMessage>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {["Sol Şerit", "Orta Şerit", "Sağ Şerit"].map((label, index) => <button key={label} onClick={() => drive(index)} className={`min-h-13 rounded-2xl text-xs font-black ${lane === index ? "bg-red-600 text-white" : "bg-red-50 text-red-700"}`}>{label}</button>)}
      </div>
    </GameFrame>
  );
}

function BasketballGame({ run, onAgain, onExit }: { run: number; onAgain: () => void; onExit: () => void }) {
  const [power, setPower] = useState(0);
  const [direction, setDirection] = useState(1);
  const [baskets, setBaskets] = useState(0);
  const [moves, setMoves] = useState(0);
  const [message, setMessage] = useState("Turuncu güç göstergesini yeşil hedefte yakala.");
  const saved = useRef(false);
  const target = 35 + ((run * 17 + baskets * 19) % 35);
  const complete = baskets >= 3;

  useEffect(() => {
    if (complete) return;
    const timer = window.setInterval(() => {
      setPower((value) => {
        if (value >= 100) { setDirection(-1); return 98; }
        if (value <= 0) { setDirection(1); return 2; }
        return value + direction * 2;
      });
    }, 35);
    return () => window.clearInterval(timer);
  }, [complete, direction]);

  useEffect(() => {
    if (!complete || saved.current) return;
    saved.current = true;
    void AppStorage.recordGameResult("basketball", moves);
  }, [complete, moves]);

  const shoot = () => {
    setMoves((value) => value + 1);
    if (Math.abs(power - target) <= 12) {
      setBaskets((value) => value + 1);
      setMessage("Fileler sallandı, basket! Ritim duygun harika 🏀");
    } else {
      setMessage(power < target ? "Biraz daha güç ekleyebiliriz; top yeniden sende 💪" : "Bu kez biraz yumuşak deneyelim; sınırsız atış hakkın var ✨");
    }
  };

  if (complete) return <GameComplete title="Potanın Ritmi" moves={moves} onAgain={onAgain} onExit={onExit} />;
  return (
    <GameFrame title="Potanın Ritmi" icon="🏀" subtitle={`${baskets}/3 basket · ${moves} atış`} onExit={onExit}>
      <div className="rounded-3xl bg-gradient-to-b from-sky-100 to-orange-50 p-6 text-center">
        <div className="text-7xl">🏀 <span className="ml-8">⛹️</span></div>
        <div className="relative mt-8 h-7 overflow-hidden rounded-full bg-slate-200">
          <div className="absolute inset-y-0 rounded-full bg-emerald-400/70" style={{ left: `${target - 12}%`, width: "24%" }} />
          <div className="absolute inset-y-0 w-2 -translate-x-1/2 rounded-full bg-orange-600 shadow" style={{ left: `${power}%` }} />
        </div>
      </div>
      <FriendlyMessage>{message}</FriendlyMessage>
      <button onClick={shoot} className="mt-4 min-h-14 w-full rounded-2xl bg-orange-600 text-base font-black text-white">Atış Yap!</button>
    </GameFrame>
  );
}

type SwimBeat = "left" | "right" | "breath";
const SWIM_BEATS: Record<SwimBeat, { icon: string; label: string }> = {
  left: { icon: "🫲", label: "Sol kulaç" },
  right: { icon: "🫱", label: "Sağ kulaç" },
  breath: { icon: "💨", label: "Nefes" },
};

function SwimmingGame({ run, onAgain, onExit }: { run: number; onAgain: () => void; onExit: () => void }) {
  const [lap, setLap] = useState(1);
  const [showPattern, setShowPattern] = useState(true);
  const [answer, setAnswer] = useState<SwimBeat[]>([]);
  const [moves, setMoves] = useState(0);
  const [message, setMessage] = useState("Kulaç ve nefes ritmini incele; hazır olunca aklından tekrar et.");
  const saved = useRef(false);
  const pattern = useMemo(() => {
    const beats: SwimBeat[] = ["left", "right", "breath"];
    return Array.from({ length: 3 + lap }, (_, index) => beats[(run + lap * 2 + index * (lap + 1)) % beats.length]);
  }, [lap, run]);
  const complete = lap > 3;

  useEffect(() => {
    if (!complete || saved.current) return;
    saved.current = true;
    void AppStorage.recordGameResult("swimming", moves);
  }, [complete, moves]);

  const addBeat = (beat: SwimBeat) => {
    const next = [...answer, beat];
    setAnswer(next);
    setMoves((value) => value + 1);
    const index = next.length - 1;
    if (pattern[index] !== beat) {
      setAnswer([]);
      setShowPattern(true);
      setMessage("Ritim biraz karıştı; bu da antrenmanın parçası. Desene yeniden bakalım 🌊");
      return;
    }
    if (next.length === pattern.length) {
      setLap((value) => value + 1);
      setAnswer([]);
      setShowPattern(true);
      setMessage("Havuz tamamlandı! Yeni ritim biraz daha uzun olacak 🏊");
    } else setMessage("Ritmi yakaladın, devam et!");
  };

  if (complete) return <GameComplete title="Yüzme Ritmi" moves={moves} onAgain={onAgain} onExit={onExit} />;
  return (
    <GameFrame title="Yüzme Ritmi" icon="🏊" subtitle={`${lap}/3 havuz · ${answer.length}/${pattern.length} ritim`} onExit={onExit}>
      <div className="rounded-3xl bg-gradient-to-br from-cyan-100 to-blue-200 p-6 text-center">
        <p className="mb-4 text-xs font-black uppercase tracking-wider text-blue-700">{showPattern ? "Ritmi İncele" : "Şimdi Sen Tekrarla"}</p>
        <div className="flex min-h-16 flex-wrap items-center justify-center gap-3">
          {(showPattern ? pattern : answer).map((beat, index) => <span key={`${beat}-${index}`} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">{SWIM_BEATS[beat].icon}</span>)}
          {!showPattern && answer.length === 0 && <span className="text-sm font-bold text-blue-600">İlk hareketi seç</span>}
        </div>
      </div>
      <FriendlyMessage>{message}</FriendlyMessage>
      {showPattern ? <button onClick={() => { setShowPattern(false); setMessage("Sırayı aynı biçimde kur; acele etmene gerek yok."); }} className="mt-4 min-h-14 w-full rounded-2xl bg-blue-600 font-black text-white">Hazırım, Ritmi Kapat</button> : (
        <div className="mt-4 grid grid-cols-3 gap-2">{(Object.keys(SWIM_BEATS) as SwimBeat[]).map((beat) => <button key={beat} onClick={() => addBeat(beat)} className="min-h-16 rounded-2xl bg-blue-50 text-sm font-black text-blue-800"><span className="block text-2xl">{SWIM_BEATS[beat].icon}</span>{SWIM_BEATS[beat].label}</button>)}</div>
      )}
    </GameFrame>
  );
}

function MoveButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-label={label} onClick={onClick} className="flex h-13 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md [&_svg]:h-5 [&_svg]:w-5">{children}</button>;
}

function FriendlyMessage({ children }: { children: React.ReactNode }) {
  return <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm font-bold leading-relaxed text-amber-900">💛 {children}</div>;
}

function GameFrame({ title, icon, subtitle, onExit, children }: { title: string; icon: string; subtitle: string; onExit: () => void; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-3xl bg-white p-4 shadow-soft">
        <div className="flex min-w-0 items-center gap-3"><span className="text-3xl">{icon}</span><div className="min-w-0"><h1 className="truncate font-black text-slate-900">{title}</h1><p className="text-xs font-bold text-slate-400">{subtitle}</p></div></div>
        <button onClick={onExit} className="flex min-h-11 items-center gap-1 rounded-2xl bg-slate-100 px-3 text-xs font-bold text-slate-600"><ArrowLeft className="h-4 w-4" /> Çık</button>
      </div>
      <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-soft sm:p-7">{children}</div>
    </div>
  );
}

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [run, setRun] = useState(1);
  const exit = () => { setActiveGame(null); setRun((value) => value + 1); };
  const playAgain = () => setRun((value) => value + 1);

  if (activeGame) {
    return <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 lg:p-8">
      {activeGame === "memory" ? <MemoryGame key={`memory-${run}`} run={run} onAgain={playAgain} onExit={exit} /> :
       activeGame === "symmetry" ? <SymmetryGame key={`symmetry-${run}`} run={run} onAgain={playAgain} onExit={exit} /> :
       activeGame === "ocean" ? <OceanGame key={`ocean-${run}`} onAgain={playAgain} onExit={exit} /> :
       activeGame === "race" ? <RaceGame key={`race-${run}`} run={run} onAgain={playAgain} onExit={exit} /> :
       activeGame === "basketball" ? <BasketballGame key={`basketball-${run}`} run={run} onAgain={playAgain} onExit={exit} /> :
       <SwimmingGame key={`swimming-${run}`} run={run} onAgain={playAgain} onExit={exit} />}
    </div>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-700 via-blue-700 to-cyan-600 p-6 text-white shadow-xl sm:p-8">
        <Gamepad2 className="h-12 w-12" />
        <h1 className="mt-4 text-2xl font-black sm:text-3xl">Arel’in Oyun Molası</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-blue-100">Gerçekten oyna, biraz nefes al; hafıza, yön ve şekil düşünme becerilerin fark etmeden çalışsın. Süre ve kaybetme yok.</p>
        <Sparkles className="absolute -bottom-7 -right-4 h-36 w-36 text-white/10" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {GAME_CARDS.map((game) => (
          <button key={game.id} onClick={() => setActiveGame(game.id)} className="group overflow-hidden rounded-[2rem] border border-slate-100 bg-white text-left shadow-soft transition-all hover:-translate-y-1 hover:shadow-xl">
            <div className={`bg-gradient-to-br ${game.color} p-6 text-white`}><span className="text-5xl">{game.icon}</span></div>
            <div className="p-5"><h2 className="text-lg font-black text-slate-900">{game.title}</h2><p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">{game.description}</p><span className="mt-4 inline-flex rounded-xl bg-blue-50 px-3 py-2 text-xs font-extrabold text-blue-700 group-hover:bg-blue-600 group-hover:text-white">Oynamaya Başla</span></div>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-xs font-bold text-emerald-800"><RotateCcw className="h-5 w-5 flex-shrink-0" /> Her oyunda desenler ve kartlar değişir; istediğin kadar yeni tur oynayabilirsin.</div>
    </div>
  );
}
