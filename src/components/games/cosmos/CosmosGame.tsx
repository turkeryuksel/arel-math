"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Compass, Lightbulb, Pause, Play, Rocket, Sparkles, Star, Volume2, VolumeX } from "lucide-react";
import { AppStorage } from "@/lib/firebase/storageProvider";
import type { Question } from "@/lib/questions/types";
import { COSMOS_REGIONS, COSMOS_ROUNDS, COSMOS_TABLES, createCosmosQuestion, type FlightMode } from "@/lib/games/cosmos";
import GameComplete from "@/components/games/GameComplete";
import CosmosField from "./CosmosField";
import styles from "./cosmos.module.css";

type SavedAnswer = { recordedAt: string; question: Question; value: number; correct: boolean; responseTimeMs: number };
const STARS = [{ x: 12, y: 68 }, { x: 30, y: 30 }, { x: 48, y: 54 }, { x: 67, y: 18 }, { x: 86, y: 45 }];

function Constellation({ lit, large = false }: { lit: number; large?: boolean }) {
  return <svg viewBox="0 0 100 90" className={large ? styles.largeConstellation : styles.constellation} aria-hidden="true">
    {STARS.slice(1).map((p, i) => <line key={i} x1={STARS[i].x} y1={STARS[i].y} x2={p.x} y2={p.y} stroke={lit > i + 1 ? "#f5d59e" : "#a8b7d12b"} strokeWidth="0.8" />)}
    {STARS.map((p, i) => <g key={i}><circle cx={p.x} cy={p.y} r={lit > i ? 5 : 2.5} fill={lit > i ? "#fff0c7" : "#71849d"} />{lit > i && <circle cx={p.x} cy={p.y} r="8" fill="#ffe0a518" />}</g>)}
  </svg>;
}

export default function CosmosGame({ onExit }: { onExit: () => void }) {
  const [tables, setTables] = useState([2, 3, 4, 5]);
  const [mode, setMode] = useState<FlightMode>("flight");
  const [started, setStarted] = useState(false);
  const [run, setRun] = useState(0);
  const [sound, setSound] = useState(false);
  return <section className={styles.cosmos} aria-label="Çarpım Kozmosu">
    {!started ? <>
      <div className={styles.setupTop}><button onClick={onExit} className={styles.quietButton}><ArrowLeft size={16} /> Oyunlara dön</button><span className={styles.eyebrow}>AREL’İN KEŞİF GÜNLÜĞÜ / 01</span></div>
      <div className={styles.setupGrid}>
        <div className={styles.intro}>
          <span className={styles.tag}><Sparkles size={14} /> YENİ BİR MATEMATİK MACERASI</span>
          <h1>Çarpım<br /><span>Kozmosu</span><i>✦</i></h1>
          <p>Bir işlem. Dört yıldız.<br />Doğru sonucu bul, gökyüzüne izini bırak.</p>
          <div className={styles.miniDemo} aria-hidden="true"><span>7 × 8</span><span className={styles.demoTrail}>⌁</span><span className={styles.demoOrb}>56</span><span className={styles.demoSpark}>✧</span></div>
          <div className={styles.introNote}><Compass size={20} /><span>Dokun veya parmağınla bir ışık izi çiz.<br /><strong>Her keşif, çarpım tablosunda bir adım.</strong></span></div>
          <div className={styles.routePreview}>{COSMOS_REGIONS.map((region, i) => <span key={region.name}><b>0{i + 1}</b>{region.name}</span>)}</div>
        </div>
        <div className={styles.launchCard}>
          <div className={styles.launchHeading}><Rocket size={22} /><div><h2>Rotanı hazırla</h2><p>15 küçük keşif · yaklaşık 3–5 dakika</p></div></div>
          <fieldset><legend>Hangi çarpımları keşfedelim?</legend><div className={styles.tableGrid}>{COSMOS_TABLES.map((table) => <button key={table} type="button" aria-pressed={tables.includes(table)}
            onClick={() => setTables((current) => current.includes(table) ? current.filter((n) => n !== table) : [...current, table].sort((a, b) => a - b))}>{table}’ler{tables.includes(table) && <Check size={12} />}</button>)}</div>
            <button className={styles.selectAll} onClick={() => setTables(tables.length === COSMOS_TABLES.length ? [2, 3, 4, 5] : [...COSMOS_TABLES])}>{tables.length === COSMOS_TABLES.length ? "Başlangıç tablolarına dön" : "Hepsini seç"}</button>
          </fieldset>
          <fieldset><legend>Nasıl uçmak istersin?</legend><div className={styles.modeGrid}>
            <button aria-pressed={mode === "calm"} onClick={() => setMode("calm")}><span>🌙 Sakin keşif</span><small>Yavaşça süzülen yıldızlar</small></button>
            <button aria-pressed={mode === "flight"} onClick={() => setMode("flight")}><span>☄️ Yıldız uçuşu</span><small>Havaya yükselen sayılar</small></button>
          </div></fieldset>
          <div className={styles.soundRow}><span>Ses efektleri</span><button role="switch" aria-checked={sound} aria-label="Ses efektleri" onClick={() => setSound(!sound)}>{sound ? <Volume2 size={17} /> : <VolumeX size={17} />}{sound ? "Açık" : "Kapalı"}</button></div>
          <button className={styles.launchButton} disabled={!tables.length} onClick={() => setStarted(true)}>Keşfe Başla <ArrowRight size={19} /></button>
          <p className={styles.launchFoot}>{tables.length ? "Can kaybı yok. Acele yok. Merak var." : "Başlamak için en az bir tablo seç."}</p>
        </div>
      </div>
      <div className={styles.setupFooter}><Star size={15} /> Doğru cevapların gelişimine, bitirdiğin macera oyun koleksiyonuna eklenir.</div>
    </> : <CosmosRun key={run} tables={tables} mode={mode} sound={sound} setSound={setSound} onExit={onExit} onAgain={() => setRun((value) => value + 1)} />}
  </section>;
}

function CosmosRun({ tables, mode, sound, setSound, onExit, onAgain }: { tables: number[]; mode: FlightMode; sound: boolean; setSound: (value: boolean) => void; onExit: () => void; onAgain: () => void }) {
  const [runId] = useState(() => crypto.randomUUID());
  const [profileId] = useState(() => AppStorage.getProfile().id);
  const [initialSignatures] = useState(() => AppStorage.getRecentSignatures());
  const recent = useRef(new Set(initialSignatures));
  const review = useRef<Array<{ table: number; after: number }>>([]);
  const [question, setQuestion] = useState(() => createCosmosQuestion(runId, 0, tables, initialSignatures));
  const sequence = useRef(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [answer, setAnswer] = useState<SavedAnswer | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [completed, setCompleted] = useState(false);
  const lock = useRef(false);
  const saving = useRef(false);
  const appliedAnswers = useRef(new Set<string>());
  const advancing = useRef(false);
  const pauseDialog = useRef<HTMLDivElement>(null);
  const activeSeconds = useRef(0);
  const audio = useRef<AudioContext | null>(null);
  const mounted = useRef(true);
  const regionIndex = Math.min(2, Math.floor(index / 5));
  const region = COSMOS_REGIONS[regionIndex];

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; void audio.current?.close(); };
  }, []);
  useEffect(() => {
    const visibility = () => { if (document.hidden) setPaused(true); };
    const keyboard = (event: KeyboardEvent) => { if (event.key === "Escape") setPaused((value) => !value); };
    document.addEventListener("visibilitychange", visibility); window.addEventListener("keydown", keyboard);
    return () => { document.removeEventListener("visibilitychange", visibility); window.removeEventListener("keydown", keyboard); };
  }, []);
  useEffect(() => {
    if (paused || answer || completed) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      if (!document.hidden) activeSeconds.current += Math.min(0.5, (now - last) / 1000);
      last = now;
    }, 100);
    return () => clearInterval(timer);
  }, [paused, answer, completed]);

  const chime = (correct: boolean) => {
    if (!sound) return;
    try {
      audio.current ||= new AudioContext();
      void audio.current.resume().catch(() => {});
      const ctx = audio.current;
      const oscillator = ctx.createOscillator(); const volume = ctx.createGain();
      oscillator.type = "sine"; oscillator.frequency.setValueAtTime(correct ? 660 : 240, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(correct ? 990 : 180, ctx.currentTime + 0.15);
      volume.gain.setValueAtTime(0.0001, ctx.currentTime); volume.gain.exponentialRampToValueAtTime(0.07, ctx.currentTime + 0.02); volume.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      oscillator.connect(volume); volume.connect(ctx.destination); oscillator.start(); oscillator.stop(ctx.currentTime + 0.32);
    } catch { /* Sound is optional; unsupported browsers keep the game playable. */ }
  };
  const persist = async (record: SavedAnswer) => {
    if (saving.current) return;
    saving.current = true; setSaveState("saving");
    try {
      if (AppStorage.getProfile().id !== profileId) throw new Error("Öğrenci değişti");
      await AppStorage.recordPracticeAnswer(record.question, record.value, record.correct, record.responseTimeMs, {
        recordedAt: record.recordedAt, gameId: "cosmos", gameRunId: runId,
      });
      if (mounted.current && !appliedAnswers.current.has(record.question.id)) {
        appliedAnswers.current.add(record.question.id);
        setAttemptCount((count) => count + 1);
        if (record.correct) {
          setCorrectCount((count) => count + 1);
          setCombo((count) => count + 1);
          setBestCombo((count) => Math.max(count, combo + 1));
        } else {
          setCombo(0);
          review.current.push({ table: Number(record.question.metadata?.table), after: index + 3 });
        }
        recent.current.delete(record.question.signature);
        recent.current.add(record.question.signature);
      }
      if (mounted.current) setSaveState("saved");
    } catch { if (mounted.current) setSaveState("error"); }
    finally { saving.current = false; }
  };
  const choose = (value: number) => {
    if (lock.current || paused || completed) return;
    lock.current = true;
    advancing.current = false;
    const correct = value === Number(question.answer);
    const record = { recordedAt: new Date().toISOString(), question, value, correct, responseTimeMs: Math.max(1, Math.round(activeSeconds.current * 1000)) };
    setAnswer(record); chime(correct);
    void persist(record);
  };
  const next = () => {
    if (saveState !== "saved" || !answer || advancing.current) return;
    advancing.current = true;
    if (index + 1 === COSMOS_ROUNDS && answer.correct) { setCompleted(true); return; }
    const nextIndex = index >= 10 && !answer.correct ? index : index + 1;
    sequence.current += 1;
    const due = review.current.findIndex((item) => item.after <= nextIndex);
    const reviewTable = due >= 0 ? review.current.splice(due, 1)[0].table : undefined;
    setQuestion(createCosmosQuestion(runId, sequence.current, tables, recent.current, reviewTable));
    setIndex(nextIndex); setAnswer(null); setSaveState("idle"); setShowHint(false); activeSeconds.current = 0; lock.current = false;
  };
  // Quick correct-answer transitions keep the arcade flow; explanations wait for the learner.
  useEffect(() => {
    if (!answer?.correct || saveState !== "saved" || paused || (index + 1) % 5 === 0) return;
    const timer = setTimeout(() => { document.getElementById(`cosmos-next-${runId}`)?.click(); }, 1100);
    return () => clearTimeout(timer);
  }, [answer, saveState, paused, index, runId]);

  if (completed) return <div className={styles.finished}>
    <div className={styles.finishSky}><Constellation lit={5} large /><span>KEŞİF GÜNLÜĞÜ TAMAMLANDI</span><h2>Gökyüzünde bir izin var.</h2><p>{correctCount} doğru keşif · en uzun seri {bestCombo} · {attemptCount} çarpım çalışması</p></div>
    <GameComplete resultId={runId} ownerProfileId={profileId} gameId="cosmos" title="Çarpım Kozmosu" moves={attemptCount} onAgain={onAgain} onExit={onExit} />
  </div>;

  return <>
    <header className={styles.gameHeader}><button className={styles.quietButton} onClick={() => setPaused(true)} aria-label="Oyunu duraklat"><Pause size={18} /> Mola</button><span className={styles.wordmark}>ÇARPIM <strong>KOZMOSU</strong></span><button className={styles.quietButton} aria-label={sound ? "Sesi kapat" : "Sesi aç"} onClick={() => setSound(!sound)}>{sound ? <Volume2 size={18} /> : <VolumeX size={18} />}</button></header>
    <div className={styles.journey} aria-label="Keşif rotası">{COSMOS_REGIONS.map((item, i) => <span key={item.name} className={i === regionIndex ? styles.activeRegion : ""} aria-current={i === regionIndex ? "step" : undefined}><b>{i < regionIndex ? "✓" : `0${i + 1}`}</b>{item.name}</span>)}</div>
    <div className={styles.stageHeading}><div><span className={styles.eyebrow}>{region.caption}</span><h2>{region.name}</h2></div><div className={styles.tally}><Star size={17} /><strong>{correctCount}</strong><span>{index + 1} / {COSMOS_ROUNDS} keşif</span></div></div>
    <div className={styles.playStage} data-region={regionIndex}>
      <div className={styles.questionDock}><span>HANGİ YILDIZ?</span><p>{question.prompt}<span> = ?</span></p><button aria-expanded={showHint} onClick={() => setShowHint(!showHint)} disabled={!!answer}><Lightbulb size={16} /> İpucu</button></div>
      <div className={styles.combo} aria-live="polite">{combo >= 3 ? <><Sparkles size={16} /> {combo >= 8 ? "EFSANEVİ!" : combo >= 5 ? "HARİKA!" : "IŞIL IŞIL!"} {combo} yıldızlık seri!</> : <><span>✧</span> Her çarpım yeni bir keşif</>}</div>
      {showHint && !answer && <div className={styles.hint} role="status">{question.hint}</div>}
      <CosmosField choices={question.choices as number[]} mode={mode} paused={paused} disabled={!!answer} selected={answer?.value ?? null} correctAnswer={Number(question.answer)} revealed={!!answer} onChoose={choose} finalStage={regionIndex === 2} charge={index % 5 + (answer?.correct ? 1 : 0)} />
      {answer && <div className={styles.feedback} role="status" aria-live="polite">
        <span className={styles.feedbackIcon}>{answer.correct ? "✦" : "✧"}</span>
        <div><strong>{answer.correct ? combo >= 3 ? "Işıl ışıl bir seri!" : "Yıldızını buldun!" : "Birlikte keşfedelim"}</strong><p>{question.prompt} = {String(question.answer)}</p>{!answer.correct && regionIndex === 2 && <small>Bu yıldız için bir çarpım daha keşfedelim.</small>}{!answer.correct && <small>{question.hint}</small>}</div>
        {saveState === "error" ? <div role="alert"><p>Cevabını kaydedemedik.</p><button onClick={() => void persist(answer)}>Kaydı tekrar dene</button></div> : saveState === "saving" ? <span>Kaydediliyor…</span> : <button id={`cosmos-next-${runId}`} onClick={next}>{index === COSMOS_ROUNDS - 1 && answer.correct ? "Takımyıldızını gör" : (index + 1) % 5 === 0 ? "Yeni bölgeye uç" : "Devam"}<ArrowRight size={16} /></button>}
      </div>}
      <div className={styles.stageBottom}><Constellation lit={index % 5 + (answer && (index < 10 || answer.correct) ? 1 : 0)} /><span>{mode === "calm" ? "SAKİN KEŞİF" : "YILDIZ UÇUŞU"}<small>{tables.join(" · ")} tabloları</small></span><div role="progressbar" aria-label="Tamamlanan keşifler" aria-valuemin={0} aria-valuemax={COSMOS_ROUNDS} aria-valuenow={index + (answer && saveState === "saved" && (index < 10 || answer.correct) ? 1 : 0)} className={styles.progress}><i style={{ width: `${(index + (answer && saveState === "saved" && (index < 10 || answer.correct) ? 1 : 0)) / COSMOS_ROUNDS * 100}%` }} /></div></div>
      {paused && <div ref={pauseDialog} onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const buttons = pauseDialog.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
        if (!buttons?.length) return;
        const first = buttons[0]; const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }} className={styles.pauseOverlay} role="dialog" aria-modal="true" aria-label="Keşif molası"><div><span>☾</span><h2>Yıldızlar seni bekler.</h2><p>Bir nefes al. Hazır olduğunda kaldığın yerden devam et.</p><button autoFocus className={styles.launchButton} onClick={() => setPaused(false)}><Play size={18} /> Keşfe devam et</button><button className={styles.quietButton} disabled={saveState === "saving"} onClick={onExit}><ArrowLeft size={16} /> Oyunlara dön</button><small>Kaydedilmiş cevapların korunur. Bitmemiş rota yeniden başlar.</small></div></div>}
    </div>
  </>;
}
