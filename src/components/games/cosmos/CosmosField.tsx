"use client";

import { useEffect, useRef, useState } from "react";
import { orbPosition, segmentHitsCircle, type FlightMode, type Point } from "@/lib/games/cosmos";
import styles from "./cosmos.module.css";

interface Props {
  choices: number[];
  mode: FlightMode;
  paused: boolean;
  disabled: boolean;
  selected: number | null;
  correctAnswer: number;
  revealed: boolean;
  finalStage: boolean;
  charge: number;
  onChoose: (value: number) => void;
}
interface Spark extends Point { vx: number; vy: number; life: number; color: string }
const COLORS = ["#95ead9", "#f7dba8", "#cdb8f8", "#a2d6fa"];

export default function CosmosField({ choices, mode, paused, disabled, selected, correctAnswer, revealed, onChoose, finalStage, charge }: Props) {
  const field = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const targets = useRef<Array<HTMLButtonElement | null>>([]);
  const centers = useRef<Point[]>([]);
  const pointer = useRef<{ id: number; point: Point } | null>(null);
  const trail = useRef<Array<Point & { life: number }>>([]);
  const sparks = useRef<Spark[]>([]);
  const consumed = useRef(false);
  const elapsed = useRef(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update(); preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (paused || disabled) pointer.current = null;
  }, [paused, disabled]);

  useEffect(() => {
    const root = field.current;
    const surface = canvas.current;
    if (!root || !surface) return;
    const ctx = surface.getContext("2d");
    let frame = 0;
    let last = 0;
    let width = root.clientWidth;
    let height = root.clientHeight;
    const resize = () => {
      width = root.clientWidth; height = root.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      surface.width = width * dpr; surface.height = height * dpr;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize); observer.observe(root);
    const draw = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      if (!paused && !disabled && document.visibilityState === "visible") elapsed.current += dt;
      centers.current = choices.map((_, index) => orbPosition(index, width, height, elapsed.current, mode, reducedMotion));
      centers.current.forEach((point, index) => {
        const target = targets.current[index];
        if (target) { target.style.left = "0"; target.style.top = "0"; target.style.transform = `translate(${point.x}px, ${point.y}px) translate(-50%, -50%)`; }
      });
      if (ctx) {
        ctx.clearRect(0, 0, width, height);
        if (!paused) {
          trail.current = trail.current.map((p) => ({ ...p, life: p.life - dt * 3 })).filter((p) => p.life > 0);
          sparks.current = sparks.current.map((p) => ({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, vy: p.vy + 100 * dt, life: p.life - dt })).filter((p) => p.life > 0);
        }
        for (let i = 1; i < trail.current.length; i++) {
          const previous = trail.current[i - 1]; const point = trail.current[i];
          ctx.beginPath(); ctx.moveTo(previous.x, previous.y); ctx.lineTo(point.x, point.y);
          ctx.lineWidth = Math.max(1, point.life * 7); ctx.lineCap = "round";
          ctx.strokeStyle = `rgba(194, 248, 230, ${point.life})`; ctx.shadowBlur = 14; ctx.shadowColor = "#9cf4d9"; ctx.stroke();
        }
        ctx.shadowBlur = 0;
        for (const spark of sparks.current) {
          ctx.globalAlpha = Math.min(1, spark.life * 2); ctx.fillStyle = spark.color;
          ctx.beginPath(); ctx.arc(spark.x, spark.y, 2.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [choices, mode, paused, disabled, reducedMotion]);

  const choose = (value: number, index: number) => {
    if (disabled || paused || consumed.current) return;
    consumed.current = true;
    const point = centers.current[index];
    if (point && !reducedMotion) {
      sparks.current = Array.from({ length: 28 }, (_, i) => ({ ...point, vx: Math.cos(i * 2.4) * (50 + i * 5), vy: Math.sin(i * 2.4) * (50 + i * 5), life: 0.8, color: COLORS[index] }));
    }
    onChoose(value);
  };
  const sweep = (from: Point, to: Point) => {
    for (let index = 0; index < centers.current.length; index++) {
      const radius = Math.max(26, (targets.current[index]?.offsetWidth || 64) / 2);
      if (segmentHitsCircle(from, to, centers.current[index], radius)) { choose(choices[index], index); break; }
    }
  };
  const localPoint = (event: React.PointerEvent) => {
    const rect = field.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  return <div ref={field} className={styles.field} aria-label="Sayı yıldızları oyun alanı"
    onPointerDown={(event) => {
      if (paused || disabled || !event.isPrimary || event.button !== 0) return;
      const point = localPoint(event); pointer.current = { id: event.pointerId, point };
      event.currentTarget.setPointerCapture(event.pointerId);
      trail.current = [{ ...point, life: 1 }]; sweep(point, point);
    }}
    onPointerMove={(event) => {
      if (!pointer.current || pointer.current.id !== event.pointerId || paused || disabled) return;
      const point = localPoint(event); trail.current.push({ ...point, life: 1 });
      if (trail.current.length > 40) trail.current.shift();
      sweep(pointer.current.point, point); pointer.current.point = point;
    }}
    onPointerUp={() => { pointer.current = null; }} onPointerCancel={() => { pointer.current = null; }} onLostPointerCapture={() => { pointer.current = null; }}>
    {finalStage && <svg className={styles.starGate} viewBox="0 0 200 200" aria-label={`${charge} / 5 final yıldızı`}>
      <circle cx="100" cy="100" r="74" fill="#ab9fc509" stroke="#d5bbef30" strokeWidth="1" />
      <circle cx="100" cy="100" r="59" fill="none" stroke="#d5bbef20" strokeWidth="1" strokeDasharray="3 8" />
      {[0,1,2,3,4].map((i) => { const a = (i * 72 - 90) * Math.PI / 180; return <g key={i}><circle cx={100 + Math.cos(a) * 74} cy={100 + Math.sin(a) * 74} r={i < charge ? 7 : 4} fill={i < charge ? "#ffe3a9" : "#6f7093"} /><circle cx={100 + Math.cos(a) * 74} cy={100 + Math.sin(a) * 74} r="12" fill={i < charge ? "#ffe3a918" : "none"} /></g>; })}
      <path d="M100 65 L110 90 L137 100 L110 110 L100 135 L90 110 L63 100 L90 90Z" fill="#e9caef33" stroke="#e2c6f17a" />
    </svg>}
    <div className={styles.orbitRing} aria-hidden="true" />
    <div className={styles.planet} aria-hidden="true"><span /></div>
    <canvas ref={canvas} className={styles.trail} aria-hidden="true" />
    {choices.map((value, index) => <button key={value} ref={(node) => { targets.current[index] = node; }}
      type="button" aria-label={`${value} sonucunu yakala`} disabled={disabled || paused}
      onClick={() => choose(value, index)}
      className={`${styles.orb} ${revealed && value === correctAnswer ? styles.correctOrb : ""} ${revealed && selected === value && value !== correctAnswer ? styles.wrongOrb : ""}`}
      style={{ "--orb-color": COLORS[index], left: `${15 + index * 23.33}%`, top: "45%", transform: "translate(-50%, -50%)" } as React.CSSProperties}>
      <span className={styles.orbShine} aria-hidden="true" /><span>{value}</span>
      
    </button>)}
    <p className={styles.fieldHint}>{mode === "calm" ? "Kendi hızında keşfet" : "Işık izini doğru yıldızdan geçir"}<span>Dokun · kaydır · veya Tab + Enter</span></p>
  </div>;
}
