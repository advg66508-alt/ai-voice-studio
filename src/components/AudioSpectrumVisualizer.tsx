import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Activity, BarChart3, Waves, Volume2, Sparkles } from 'lucide-react';

interface AudioSpectrumVisualizerProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  audioUrl: string | null;
  currentTime: number;
  duration: number;
  speedRate?: number;
  genderLabel?: string;
  voiceName?: string;
}

// Module-level cache for MediaElementSourceNodes to prevent "already connected" Web Audio API exceptions
const elementSourceCache = new WeakMap<
  HTMLAudioElement,
  {
    ctx: AudioContext;
    analyser: AnalyserNode;
    source: MediaElementAudioSourceNode;
  }
>();

export const AudioSpectrumVisualizer: React.FC<AudioSpectrumVisualizerProps> = ({
  audioElement,
  isPlaying,
  audioUrl,
  currentTime,
  duration,
  genderLabel = 'เสียงพากย์',
  voiceName = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [visualizerMode, setVisualizerMode] = useState<'bars' | 'wave' | 'dots'>('bars');
  const [peakDb, setPeakDb] = useState<number>(-48);
  const [energyLevel, setEnergyLevel] = useState<number>(0);
  const [isWebAudioActive, setIsWebAudioActive] = useState<boolean>(false);

  // Peak caps array for falling bar peaks
  const peaksRef = useRef<number[]>([]);
  const peakHoldTimeRef = useRef<number[]>([]);

  // Setup or retrieve Web Audio API node graph
  const getOrCreateAudioNodes = useCallback(() => {
    if (!audioElement) return null;

    if (elementSourceCache.has(audioElement)) {
      const cached = elementSourceCache.get(audioElement)!;
      if (cached.ctx.state === 'suspended') {
        cached.ctx.resume().catch(() => {});
      }
      return cached;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;

      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256; // 128 frequency bins
      analyser.smoothingTimeConstant = 0.82; // smooth, musical transitions
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;

      const source = ctx.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      const nodeData = { ctx, analyser, source };
      elementSourceCache.set(audioElement, nodeData);
      setIsWebAudioActive(true);
      return nodeData;
    } catch (err) {
      console.warn('Web Audio API createMediaElementSource fallback:', err);
      return null;
    }
  }, [audioElement]);

  // Main Render Loop for Real-time Spectrum Analyzer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;

    let isRunning = true;
    const numBars = 42; // Number of frequency bands to display

    // Initialize peaks array if needed
    if (peaksRef.current.length !== numBars) {
      peaksRef.current = new Array(numBars).fill(0);
      peakHoldTimeRef.current = new Array(numBars).fill(0);
    }

    const render = () => {
      if (!isRunning) return;

      const nodes = getOrCreateAudioNodes();
      const width = canvas.width;
      const height = canvas.height;

      // Handle high-DPI scaling
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
      }
      ctx2d.save();
      ctx2d.scale(dpr, dpr);

      const renderWidth = displayWidth;
      const renderHeight = displayHeight;

      // Clear with sleek dark gradient
      ctx2d.clearRect(0, 0, renderWidth, renderHeight);

      // Draw subtle background grid lines
      ctx2d.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx2d.lineWidth = 1;
      for (let y = renderHeight * 0.25; y < renderHeight; y += renderHeight * 0.25) {
        ctx2d.beginPath();
        ctx2d.moveTo(0, y);
        ctx2d.lineTo(renderWidth, y);
        ctx2d.stroke();
      }

      // Frequency data array
      const dataArray = new Uint8Array(nodes ? nodes.analyser.frequencyBinCount : 64);
      let totalEnergy = 0;

      if (nodes && isPlaying) {
        nodes.analyser.getByteFrequencyData(dataArray);
      } else if (isPlaying) {
        // High-fidelity fallback simulation based on speech rhythm
        const time = currentTime * 8;
        for (let i = 0; i < numBars; i++) {
          const formantFactor = Math.sin((i / numBars) * Math.PI) * 0.9;
          const rhythm = (Math.sin(time + i * 0.35) * 0.5 + 0.5) * (Math.sin(time * 0.4) * 0.3 + 0.7);
          const noise = (Math.sin(i * 99 + time * 3) * 0.15 + 0.15);
          dataArray[i] = Math.min(255, Math.floor((formantFactor * rhythm + noise) * 220));
        }
      } else {
        // Idle gentle heartbeat wave
        const idleTime = Date.now() * 0.002;
        for (let i = 0; i < numBars; i++) {
          const idleWave = Math.sin(idleTime + i * 0.2) * 8 + 10;
          dataArray[i] = Math.max(4, Math.floor(idleWave));
        }
      }

      // Calculate overall energy and peak dB
      let maxVal = 0;
      for (let i = 0; i < numBars; i++) {
        const val = dataArray[i] || 0;
        totalEnergy += val;
        if (val > maxVal) maxVal = val;
      }
      const avgEnergy = totalEnergy / numBars;
      const energyNorm = Math.min(1, avgEnergy / 180);
      setEnergyLevel(energyNorm);

      if (isPlaying) {
        const db = maxVal > 0 ? 20 * Math.log10(maxVal / 255) : -60;
        setPeakDb(Math.round(Math.max(-48, Math.min(0, db))));
      } else {
        setPeakDb(-48);
      }

      // ==========================================
      // MODE 1: SPECTRUM BARS (แท่งกราฟความถี่ Real-Time)
      // ==========================================
      if (visualizerMode === 'bars') {
        const gap = 3;
        const totalGap = gap * (numBars - 1);
        const barWidth = Math.max(2, (renderWidth - totalGap) / numBars);
        const baseline = renderHeight - 8;
        const maxBarHeight = renderHeight - 20;

        for (let i = 0; i < numBars; i++) {
          // Weight human vocal frequencies (human voice formants live in bins 2 to 24)
          const freqIndex = Math.min(dataArray.length - 1, Math.floor(Math.pow(i / numBars, 1.3) * dataArray.length));
          const rawValue = dataArray[freqIndex] || 0;
          const normalized = rawValue / 255;
          const barHeight = Math.max(3, normalized * maxBarHeight);

          const x = i * (barWidth + gap);
          const y = baseline - barHeight;

          // Update peak hold with smooth gravity
          if (barHeight >= peaksRef.current[i]) {
            peaksRef.current[i] = barHeight;
            peakHoldTimeRef.current[i] = Date.now() + 180; // hold peak for 180ms
          } else if (Date.now() > peakHoldTimeRef.current[i]) {
            peaksRef.current[i] = Math.max(0, peaksRef.current[i] - 1.8); // fall speed
          }

          // Dynamic vibrant gradient (Amber -> Orange -> Rose/Emerald)
          const gradient = ctx2d.createLinearGradient(0, baseline, 0, y);
          if (i < numBars * 0.3) {
            // Low frequencies (Bass & Fundamantals): Amber Gold
            gradient.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
            gradient.addColorStop(0.6, '#F59E0B');
            gradient.addColorStop(1, '#FBBF24');
          } else if (i < numBars * 0.7) {
            // Mid frequencies (Vocal Formants): Orange / Amber Glow
            gradient.addColorStop(0, 'rgba(234, 88, 12, 0.4)');
            gradient.addColorStop(0.6, '#EA580C');
            gradient.addColorStop(1, '#FB923C');
          } else {
            // High frequencies (Treble / Sibilance): Rose / Pink
            gradient.addColorStop(0, 'rgba(225, 29, 72, 0.4)');
            gradient.addColorStop(0.6, '#E11D48');
            gradient.addColorStop(1, '#FDA4AF');
          }

          // Draw main rounded bar
          ctx2d.fillStyle = gradient;
          ctx2d.beginPath();
          if (ctx2d.roundRect) {
            ctx2d.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
          } else {
            ctx2d.rect(x, y, barWidth, barHeight);
          }
          ctx2d.fill();

          // Glossy reflection underneath baseline
          ctx2d.fillStyle = 'rgba(245, 158, 11, 0.08)';
          ctx2d.fillRect(x, baseline + 2, barWidth, Math.min(10, barHeight * 0.25));

          // Draw falling peak cap indicator
          const peakY = baseline - peaksRef.current[i];
          if (peakY < baseline - 2) {
            ctx2d.fillStyle = i < numBars * 0.5 ? '#FDE68A' : '#FECDD3';
            ctx2d.shadowColor = '#F59E0B';
            ctx2d.shadowBlur = isPlaying ? 6 : 0;
            ctx2d.fillRect(x, Math.max(4, peakY - 2), barWidth, 2);
            ctx2d.shadowBlur = 0;
          }
        }
      }

      // ==========================================
      // MODE 2: NEON OSCILLOSCOPE WAVE (คลื่นความถี่นีออน)
      // ==========================================
      else if (visualizerMode === 'wave') {
        const midY = renderHeight / 2;
        ctx2d.lineWidth = 2.5;

        // Wave gradient
        const waveGradient = ctx2d.createLinearGradient(0, 0, renderWidth, 0);
        waveGradient.addColorStop(0, '#06B6D4'); // Cyan
        waveGradient.addColorStop(0.5, '#F59E0B'); // Amber
        waveGradient.addColorStop(1, '#EC4899'); // Pink

        ctx2d.strokeStyle = waveGradient;
        ctx2d.shadowColor = isPlaying ? '#F59E0B' : 'transparent';
        ctx2d.shadowBlur = isPlaying ? 12 : 0;

        ctx2d.beginPath();
        const sliceWidth = renderWidth / (numBars - 1);
        let curX = 0;

        for (let i = 0; i < numBars; i++) {
          const raw = dataArray[i] || 0;
          const amp = ((raw - 128) / 128) * (renderHeight * 0.42);
          const y = midY + amp;

          if (i === 0) {
            ctx2d.moveTo(curX, y);
          } else {
            const prevX = curX - sliceWidth;
            const prevRaw = dataArray[i - 1] || 0;
            const prevY = midY + ((prevRaw - 128) / 128) * (renderHeight * 0.42);
            const cpX = (prevX + curX) / 2;
            ctx2d.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2);
          }
          curX += sliceWidth;
        }
        ctx2d.stroke();
        ctx2d.shadowBlur = 0;

        // Secondary subtle mirror wave
        ctx2d.lineWidth = 1;
        ctx2d.strokeStyle = 'rgba(6, 182, 212, 0.3)';
        ctx2d.beginPath();
        curX = 0;
        for (let i = 0; i < numBars; i++) {
          const raw = dataArray[i] || 0;
          const amp = -((raw - 128) / 128) * (renderHeight * 0.25);
          const y = midY + amp;
          if (i === 0) ctx2d.moveTo(curX, y);
          else ctx2d.lineTo(curX, y);
          curX += sliceWidth;
        }
        ctx2d.stroke();
      }

      // ==========================================
      // MODE 3: DOT MATRIX SPECTRUM (ดอทเมทริกซ์สเปกตรัม)
      // ==========================================
      else if (visualizerMode === 'dots') {
        const gap = 4;
        const dotSize = 3;
        const totalGap = gap * (numBars - 1);
        const colWidth = (renderWidth - totalGap) / numBars;
        const maxDots = 12;

        for (let i = 0; i < numBars; i++) {
          const raw = dataArray[i] || 0;
          const litCount = Math.round((raw / 255) * maxDots);
          const x = i * (colWidth + gap);

          for (let d = 0; d < maxDots; d++) {
            const y = renderHeight - 12 - d * (dotSize + 3);
            const isLit = d < litCount;

            if (isLit) {
              if (d > maxDots * 0.8) {
                ctx2d.fillStyle = '#EF4444'; // Red peak
              } else if (d > maxDots * 0.5) {
                ctx2d.fillStyle = '#F59E0B'; // Amber
              } else {
                ctx2d.fillStyle = '#10B981'; // Emerald
              }
            } else {
              ctx2d.fillStyle = 'rgba(30, 41, 59, 0.5)';
            }

            ctx2d.beginPath();
            ctx2d.arc(x + colWidth / 2, y, dotSize, 0, Math.PI * 2);
            ctx2d.fill();
          }
        }
      }

      ctx2d.restore();
      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioElement, isPlaying, visualizerMode, currentTime, getOrCreateAudioNodes]);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 shadow-xl space-y-2.5 relative overflow-hidden group">
      {/* Dynamic ambient energy glow */}
      <div
        className="absolute -top-12 -left-12 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-opacity duration-300"
        style={{
          backgroundColor: isPlaying ? 'rgba(245, 158, 11, 0.18)' : 'rgba(245, 158, 11, 0.04)',
          transform: `scale(${1 + energyLevel * 0.5})`,
        }}
      />

      {/* Top Header: Title, Real-time Status Badge, Mode Switcher */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
            <span>Audio Spectrum Analyzer</span>
            <span className="text-[10px] font-normal text-amber-400/90 font-mono">
              (Web Audio API Real-time)
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Live Status indicator */}
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1 transition-all ${
              isPlaying
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse'
                : 'bg-slate-800 text-slate-400 border border-slate-700/60'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
              }`}
            />
            <span>{isPlaying ? 'LIVE ANALYZER' : 'STANDBY'}</span>
          </span>

          {/* Mode switch buttons */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setVisualizerMode('bars')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                visualizerMode === 'bars'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="โหมดแท่งความถี่สเปกตรัม"
            >
              <BarChart3 className="w-3 h-3" />
              <span className="hidden sm:inline">แท่งความถี่</span>
            </button>
            <button
              type="button"
              onClick={() => setVisualizerMode('wave')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                visualizerMode === 'wave'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="โหมดคลื่นความถี่ออสซิลโลสโคป"
            >
              <Waves className="w-3 h-3" />
              <span className="hidden sm:inline">คลื่นนีออน</span>
            </button>
            <button
              type="button"
              onClick={() => setVisualizerMode('dots')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                visualizerMode === 'dots'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="โหมดดอทเมทริกซ์"
            >
              <span className="text-[10px]">•••</span>
              <span className="hidden sm:inline">ดอท</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Canvas */}
      <div className="relative w-full h-24 sm:h-28 bg-slate-950/90 rounded-xl border border-slate-800/90 overflow-hidden shadow-inner flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          style={{ imageRendering: 'auto' }}
        />

        {/* Real-time Peak Level & Frequency Band Labels Overlay */}
        <div className="absolute top-2 left-2.5 flex items-center gap-2 pointer-events-none">
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900/90 text-amber-300 border border-slate-800">
            Peak: <strong className="font-bold">{isPlaying ? `${peakDb} dB` : '-∞ dB'}</strong>
          </span>
          {isPlaying && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900/90 text-cyan-300 border border-slate-800 hidden sm:inline-block">
              {genderLabel} • 24kHz
            </span>
          )}
        </div>

        {/* Live Frequency Range labels on the baseline */}
        <div className="absolute bottom-1.5 inset-x-3 flex justify-between text-[9px] font-mono text-slate-500 pointer-events-none">
          <span>Bass (80Hz)</span>
          <span>Voice Mid (1kHz - 2.5kHz)</span>
          <span>Treble (8kHz+)</span>
        </div>
      </div>

      {/* Footer Info: VU Meter bar + Instructions */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5 pt-0.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-mono">VU LEVEL:</span>
          {/* Mini 8-segment VU Meter */}
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 8 }).map((_, segIdx) => {
              const activeThreshold = (segIdx + 1) / 8;
              const isLit = isPlaying && energyLevel >= activeThreshold * 0.7;
              return (
                <div
                  key={segIdx}
                  className={`w-2 h-2 rounded-xs transition-colors duration-75 ${
                    isLit
                      ? segIdx >= 6
                        ? 'bg-rose-500 shadow-xs shadow-rose-500'
                        : segIdx >= 4
                        ? 'bg-amber-400 shadow-xs shadow-amber-400'
                        : 'bg-emerald-400 shadow-xs shadow-emerald-400'
                      : 'bg-slate-800/80'
                  }`}
                />
              );
            })}
          </div>
        </div>

        <span className="text-[10px] text-amber-400/90 font-mono flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>ตอบสนองความถี่เสียงพูดแบบสด</span>
        </span>
      </div>
    </div>
  );
};
