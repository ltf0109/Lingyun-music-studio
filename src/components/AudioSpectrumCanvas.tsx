import React, { useEffect, useRef } from 'react';
import { soundEngine } from '../audio/soundEngine';

interface AudioSpectrumCanvasProps {
  isPlaying: boolean;
}

export const AudioSpectrumCanvas: React.FC<AudioSpectrumCanvasProps> = ({ isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const dataArray = new Uint8Array(64);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const analyser = soundEngine.getAnalyser();

      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        dataArray.fill(0);
      }

      const barCount = 32;
      const barW = Math.floor(canvas.width / barCount) - 2;

      for (let i = 0; i < barCount; i++) {
        const val = dataArray[i] || 0;
        const norm = val / 255;
        const h = Math.max(3, Math.round(norm * (canvas.height - 6)));
        const x = i * (barW + 2);
        const y = canvas.height - h;

        ctx.fillStyle = norm > 0.65 ? '#F59E0B' : norm > 0.25 ? '#38BDF8' : '#334155';
        ctx.beginPath();
        ctx.roundRect(x, y, barW, h, 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={192}
      height={34}
      className="bg-[#0B0F17] border border-[#1E293B] rounded-lg px-1.5 py-1 hidden xl:block"
      title="实时声学频谱监测"
    />
  );
};
