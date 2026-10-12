import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Calendar, Clock, MapPin, Trophy, Users } from 'lucide-react';
import ParticleText from './ui/ParticleText';
import doomImg from '../assets/doom.png';
import ironImg from '../assets/iron.png';

// Event start date: 1 November 2026 00:00:00 IST
const TARGET_EVENT_DATE = new Date('2026-11-01T00:00:00+05:30');

function calculateTimeLeft(targetDate = TARGET_EVENT_DATE) {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  if (diff <= 0) {
    return { months: '00', days: '00', hours: '00', minutes: '00', seconds: '00' };
  }

  let temp = new Date(now.getTime());
  let months = 0;
  while (true) {
    const nextMonth = new Date(temp.getTime());
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    if (nextMonth <= targetDate) {
      months++;
      temp = nextMonth;
    } else {
      break;
    }
  }

  const remMs = targetDate.getTime() - temp.getTime();
  const totalSec = Math.floor(remMs / 1000);
  const seconds = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const minutes = totalMin % 60;
  const totalHours = Math.floor(totalMin / 60);
  const hours = totalHours % 24;
  const days = Math.floor(totalHours / 24);

  return {
    months: String(months).padStart(2, '0'),
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  };
}

export default function HeroSection() {
  const heroRef = useRef(null);
  const animFrameRef = useRef(null);
  const touchTimerRef = useRef(null);

  // Fallback image sources
  const [doomSrc, setDoomSrc] = useState(doomImg);
  const [ironSrc, setIronSrc] = useState(ironImg);

  // Live countdown timer state
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Smooth cursor tracking coordinates (rAF-driven, zero React re-renders)
  const posRef = useRef({
    targetX: -9999,
    targetY: -9999,
    currentX: -9999,
    currentY: -9999,
    isHovering: false,
    settled: true,
  });

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const updatePosition = useCallback(() => {
    const p = posRef.current;
    const heroEl = heroRef.current;
    if (!heroEl) return;

    if (prefersReducedMotion) {
      p.currentX = p.targetX;
      p.currentY = p.targetY;
      heroEl.style.setProperty('--mouse-x', `${p.currentX.toFixed(1)}px`);
      heroEl.style.setProperty('--mouse-y', `${p.currentY.toFixed(1)}px`);
      p.settled = true;
      return;
    }

    // Responsive, silky smooth glide damping
    const lerpDamp = 0.28;
    p.currentX += (p.targetX - p.currentX) * lerpDamp;
    p.currentY += (p.targetY - p.currentY) * lerpDamp;

    heroEl.style.setProperty('--mouse-x', `${p.currentX.toFixed(1)}px`);
    heroEl.style.setProperty('--mouse-y', `${p.currentY.toFixed(1)}px`);

    const diffX = Math.abs(p.targetX - p.currentX);
    const diffY = Math.abs(p.targetY - p.currentY);

    if (diffX > 0.1 || diffY > 0.1 || p.isHovering) {
      animFrameRef.current = requestAnimationFrame(updatePosition);
      p.settled = false;
    } else {
      p.currentX = p.targetX;
      p.currentY = p.targetY;
      heroEl.style.setProperty('--mouse-x', `${p.currentX.toFixed(1)}px`);
      heroEl.style.setProperty('--mouse-y', `${p.currentY.toFixed(1)}px`);
      p.settled = true;
    }
  }, [prefersReducedMotion]);

  const wakeLoop = useCallback(() => {
    if (posRef.current.settled) {
      posRef.current.settled = false;
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(updatePosition);
    }
  }, [updatePosition]);

  const setPointerPos = (clientX, clientY, instant = false) => {
    const heroEl = heroRef.current;
    if (!heroEl) return;
    const rect = heroEl.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const p = posRef.current;
    p.targetX = x;
    p.targetY = y;
    if (instant || p.currentX < -5000) {
      p.currentX = x;
      p.currentY = y;
    }
    p.isHovering = true;
    heroEl.style.setProperty('--reveal-opacity', '1');
    wakeLoop();
  };

  const handleMouseMove = (e) => {
    setPointerPos(e.clientX, e.clientY);
  };

  const handleMouseEnter = (e) => {
    setPointerPos(e.clientX, e.clientY, true);
  };

  const handleMouseLeave = () => {
    const p = posRef.current;
    p.isHovering = false;
    const heroEl = heroRef.current;
    if (heroEl) {
      heroEl.style.setProperty('--reveal-opacity', '0');
    }
  };

  // Mobile touch handling (reveals circular lens at touch position without blocking scrolling)
  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length > 0) {
      const touch = e.touches[0];
      setPointerPos(touch.clientX, touch.clientY, true);
      if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches.length > 0) {
      const touch = e.touches[0];
      setPointerPos(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    touchTimerRef.current = setTimeout(() => {
      handleMouseLeave();
    }, 1800);
  };

  useEffect(() => {
    const heroEl = heroRef.current;
    if (heroEl) {
      heroEl.style.setProperty('--mouse-x', '-9999px');
      heroEl.style.setProperty('--mouse-y', '-9999px');
      heroEl.style.setProperty('--reveal-opacity', '0');
      heroEl.style.setProperty('--reveal-radius', '320px');
    }

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    };
  }, []);

  return (
    <section
      id="hero"
      ref={heroRef}
      className="doom-iron-hero"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="HackFest 3.0 Hero"
    >
      {/* 1. LAYER 1: Permanent Full-Screen DOOM Background */}
      <div className="hero-doom-layer" aria-hidden="true">
        <img
          src={doomSrc}
          alt="Doctor Doom - Hackfest 3.0"
          className="hero-character-img hero-doom-img"
          loading="eager"
          fetchPriority="high"
          onError={() => setDoomSrc('/doom.png')}
        />
      </div>

      {/* 2. LAYER 2: Localized Circular Reveal of Iron Man (Masked Around Cursor) */}
      <div className="hero-iron-layer" aria-hidden="true">
        <img
          src={ironSrc}
          alt="Iron Man - Hackfest 3.0"
          className="hero-character-img hero-iron-img"
          loading="eager"
          fetchPriority="high"
          onError={() => setIronSrc('/iron.png')}
        />
      </div>

      {/* 3. LAYER 3: Cinematic Atmospheric Vignette (Protects Text Contrast) */}
      <div className="hero-cinematic-atmosphere" aria-hidden="true" />

      {/* 4. LAYER 4: Prominent Centered Title & Countdown */}
      <div className="hero-center-stage">
        <h1 className="hero-particle-h1">
          <ParticleText
            text="HACKFEST 3.0"
            fontFamily="Neo"
            fontWeight={800}
            fontSize="clamp(2.5rem, 7vw, 7rem)"
            particleSize={2}
            density={4}
            color="#F4F7FB"
            highlightColor="#00D9FF"
            scatter={120}
            gatherDuration={1500}
            stagger={350}
            pointerRepel={25}
            repelRadius={110}
            idleDrift={0.35}
            trigger="mount"
            glow={true}
            className="hero-particle-text"
          />
        </h1>

        {/* COUNTDOWN TIMER */}
        <div className="doomsday-countdown-wrap">
          <div className="doomsday-countdown-grid">
            <div className="doomsday-time-col">
              <span className="doomsday-time-val">{timeLeft.months}</span>
              <span className="doomsday-time-lbl">MONTHS</span>
            </div>

            <span className="doomsday-time-sep">:</span>

            <div className="doomsday-time-col">
              <span className="doomsday-time-val">{timeLeft.days}</span>
              <span className="doomsday-time-lbl">DAYS</span>
            </div>

            <span className="doomsday-time-sep">:</span>

            <div className="doomsday-time-col">
              <span className="doomsday-time-val">{timeLeft.hours}</span>
              <span className="doomsday-time-lbl">HOURS</span>
            </div>

            <span className="doomsday-time-sep">:</span>

            <div className="doomsday-time-col">
              <span className="doomsday-time-val">{timeLeft.minutes}</span>
              <span className="doomsday-time-lbl">MINUTES</span>
            </div>

            <span className="doomsday-time-sep">:</span>

            <div className="doomsday-time-col">
              <span className="doomsday-time-val">{timeLeft.seconds}</span>
              <span className="doomsday-time-lbl">SECONDS</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. LAYER 5: EVENT META INFO BAR (CHAMFERED HUD RIBBON AT BOTTOM) */}
      <div className="doom-event-meta-wrapper">
        <div className="doom-event-meta-bar">
          {/* 01. DATE */}
          <div className="doom-meta-item">
            <Calendar className="doom-meta-icon" size={21} />
            <div className="doom-meta-info">
              <span className="doom-meta-label">DATE</span>
              <span className="doom-meta-value">1-2 Nov 2026</span>
            </div>
          </div>

          <div className="doom-meta-divider" />

          {/* 02. VENUE */}
          <div className="doom-meta-item">
            <Clock className="doom-meta-icon" size={21} />
            <div className="doom-meta-info">
              <span className="doom-meta-label">VENUE</span>
              <span className="doom-meta-value">REC Banda</span>
            </div>
          </div>

          <div className="doom-meta-divider" />

          {/* 03. MODE */}
          <div className="doom-meta-item">
            <MapPin className="doom-meta-icon" size={21} />
            <div className="doom-meta-info">
              <span className="doom-meta-label">MODE</span>
              <span className="doom-meta-value">On-Campus</span>
            </div>
          </div>

          <div className="doom-meta-divider" />

          {/* 04. PRIZES */}
          <div className="doom-meta-item">
            <Trophy className="doom-meta-icon" size={21} />
            <div className="doom-meta-info">
              <span className="doom-meta-label">PRIZES</span>
              <span className="doom-meta-value">Exciting Rewards</span>
            </div>
          </div>

          <div className="doom-meta-divider" />

          {/* 05. ORGANIZED BY */}
          <div className="doom-meta-item">
            <Users className="doom-meta-icon" size={21} />
            <div className="doom-meta-info">
              <span className="doom-meta-label">ORGANIZED BY</span>
              <span className="doom-meta-value">Student Developer Club</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
