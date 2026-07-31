import React, {
  useRef,
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import {
  RotateCcw,
  RotateCw,
  Trash2,
  Eraser,
  Paintbrush,
  Palette,
  Minus,
} from 'lucide-react';
import { CanvasRef } from '../types';

interface DrawingCanvasProps {
  onCanvasChange?: () => void;
}

const PRESET_COLORS = [
  { name: '숯검정', value: '#2D2D2D' },
  { name: '코랄 빨강', value: '#FF6B6B' },
  { name: '햇살 노랑', value: '#FFD93D' },
  { name: '싱그러운 초록', value: '#6BCB77' },
  { name: '맑은 파랑', value: '#4D96FF' },
  { name: '몽환적 보라', value: '#9333EA' },
  { name: '파스텔 핑크', value: '#EC4899' },
  { name: '코코아 갈색', value: '#78350F' },
  { name: '하얀 지우개', value: '#FFFFFF' },
];

const LINE_WIDTHS = [
  { label: '가늘게', value: 3 },
  { label: '보통', value: 7 },
  { label: '굵게', value: 14 },
  { label: '넓게', value: 26 },
];

export const DrawingCanvas = forwardRef<CanvasRef, DrawingCanvasProps>(
  ({ onCanvasChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const isDrawingRef = useRef(false);
    const lastPosRef = useRef<{ x: number; y: number } | null>(null);

    const [color, setColor] = useState('#FF6B6B');
    const [lineWidth, setLineWidth] = useState(7);
    const [isEraser, setIsEraser] = useState(false);
    const [bgColor, setBgColor] = useState('#FFFFFF');
    const [strokeCount, setStrokeCount] = useState(0);

    // Undo / Redo history
    const historyRef = useRef<ImageData[]>([]);
    const historyStepRef = useRef<number>(-1);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    const updateHistoryButtons = useCallback(() => {
      setCanUndo(historyStepRef.current > 0);
      setCanRedo(historyStepRef.current < historyRef.current.length - 1);
    }, []);

    const saveState = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Remove any redo steps ahead
      historyRef.current = historyRef.current.slice(0, historyStepRef.current + 1);
      historyRef.current.push(imageData);

      // Limit history to max 25 states
      if (historyRef.current.length > 25) {
        historyRef.current.shift();
      } else {
        historyStepRef.current += 1;
      }

      updateHistoryButtons();
      setStrokeCount((prev) => prev + 1);
      if (onCanvasChange) onCanvasChange();
    }, [onCanvasChange, updateHistoryButtons]);

    const initCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.floor(rect.width);
      const height = Math.floor(Math.min(rect.width * 0.75, 450));

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Reset history
      const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      historyRef.current = [initialData];
      historyStepRef.current = 0;
      updateHistoryButtons();
      setStrokeCount(0);
    }, [bgColor, updateHistoryButtons]);

    useEffect(() => {
      initCanvas();

      const handleResize = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) tempCtx.drawImage(canvas, 0, 0);

        initCanvas();

        const newCtx = canvas.getContext('2d');
        if (newCtx && tempCanvas.width > 0) {
          newCtx.drawImage(
            tempCanvas,
            0,
            0,
            canvas.width / (window.devicePixelRatio || 1),
            canvas.height / (window.devicePixelRatio || 1)
          );
        }
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [initCanvas]);

    const getPos = (
      e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();

      let clientX = 0;
      let clientY = 0;

      if ('touches' in e) {
        if (e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        }
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    const startDrawing = (
      e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
    ) => {
      isDrawingRef.current = true;
      const pos = getPos(e);
      lastPosRef.current = pos;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, (isEraser ? lineWidth * 1.5 : lineWidth) / 2, 0, Math.PI * 2);
      ctx.fillStyle = isEraser ? bgColor : color;
      ctx.fill();
    };

    const draw = (
      e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
    ) => {
      if (!isDrawingRef.current || !lastPosRef.current) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const currentPos = getPos(e);

      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(currentPos.x, currentPos.y);
      ctx.strokeStyle = isEraser ? bgColor : color;
      ctx.lineWidth = isEraser ? lineWidth * 1.8 : lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      lastPosRef.current = currentPos;
    };

    const stopDrawing = () => {
      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        lastPosRef.current = null;
        saveState();
      }
    };

    const clearCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveState();
    };

    const undo = () => {
      if (historyStepRef.current > 0) {
        historyStepRef.current -= 1;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imageData = historyRef.current[historyStepRef.current];
        ctx.putImageData(imageData, 0, 0);
        updateHistoryButtons();
        if (onCanvasChange) onCanvasChange();
      }
    };

    const redo = () => {
      if (historyStepRef.current < historyRef.current.length - 1) {
        historyStepRef.current += 1;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imageData = historyRef.current[historyStepRef.current];
        ctx.putImageData(imageData, 0, 0);
        updateHistoryButtons();
        if (onCanvasChange) onCanvasChange();
      }
    };

    useImperativeHandle(ref, () => ({
      getImageBase64: () => {
        const canvas = canvasRef.current;
        if (!canvas) return '';
        return canvas.toDataURL('image/png');
      },
      isEmpty: () => {
        return strokeCount === 0 || historyStepRef.current <= 0;
      },
      clear: clearCanvas,
      undo: undo,
      redo: redo,
    }));

    return (
      <div className="flex flex-col gap-3 w-full">
        {/* Canvas Top Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white border border-[#E6D5C3] rounded-2xl shadow-2xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsEraser(false)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                !isEraser
                  ? 'bg-[#FF6B6B] text-white shadow-xs'
                  : 'bg-[#F5EBE0] text-[#5C5246] hover:bg-[#EBE0D3] border border-[#E6D5C3]'
              }`}
            >
              <Paintbrush className="w-3.5 h-3.5" />
              펜
            </button>
            <button
              type="button"
              onClick={() => setIsEraser(true)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                isEraser
                  ? 'bg-[#2D2D2D] text-white shadow-xs'
                  : 'bg-[#F5EBE0] text-[#5C5246] hover:bg-[#EBE0D3] border border-[#E6D5C3]'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
              지우개
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={!canUndo}
              onClick={undo}
              title="되돌리기 (Undo)"
              className="p-1.5 text-[#5C5246] hover:text-[#2D2D2D] bg-white border border-[#E6D5C3] rounded-xl disabled:opacity-35 disabled:cursor-not-allowed hover:bg-[#F5EBE0] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={!canRedo}
              onClick={redo}
              title="다시 실행 (Redo)"
              className="p-1.5 text-[#5C5246] hover:text-[#2D2D2D] bg-white border border-[#E6D5C3] rounded-xl disabled:opacity-35 disabled:cursor-not-allowed hover:bg-[#F5EBE0] transition-colors cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={clearCanvas}
              title="전체 지우기"
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-600 bg-white border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              전체 지우기
            </button>
          </div>
        </div>

        {/* Color Palette & Line Thickness Row */}
        <div className="flex flex-col gap-2.5 p-3.5 bg-white border border-[#E6D5C3] rounded-2xl shadow-2xs">
          {/* Colors */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#A08E7B] mr-1 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-[#FF6B6B]" /> 팔레트:
            </span>
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  setColor(c.value);
                  setIsEraser(false);
                }}
                title={c.name}
                className={`w-6 h-6 rounded-full transition-all border cursor-pointer ${
                  c.value === '#FFFFFF' ? 'border-slate-300' : 'border-transparent'
                } ${
                  color === c.value && !isEraser
                    ? 'ring-2 ring-[#FF6B6B] ring-offset-2 scale-110 shadow-xs'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c.value }}
              />
            ))}
            <label className="relative cursor-pointer ml-1" title="커스텀 색상 선택">
              <input
                type="color"
                value={color}
                onChange={(e) => {
                  setColor(e.target.value);
                  setIsEraser(false);
                }}
                className="sr-only"
              />
              <span className="flex items-center justify-center w-6 h-6 rounded-full border border-slate-300 bg-gradient-to-tr from-[#FF6B6B] via-[#FFD93D] to-[#4D96FF] text-xs font-bold text-white hover:scale-105 transition-transform">
                +
              </span>
            </label>
          </div>

          {/* Line Thickness */}
          <div className="flex items-center gap-3 pt-2 border-t border-[#F5EBE0]">
            <span className="text-xs font-bold text-[#A08E7B] flex items-center gap-1">
              <Minus className="w-3.5 h-3.5" /> 굵기:
            </span>
            <div className="flex items-center gap-1.5">
              {LINE_WIDTHS.map((lw) => (
                <button
                  key={lw.value}
                  type="button"
                  onClick={() => setLineWidth(lw.value)}
                  className={`px-3 py-1 text-xs rounded-xl transition-all cursor-pointer ${
                    lineWidth === lw.value
                      ? 'bg-[#FF6B6B] text-white font-bold shadow-xs'
                      : 'bg-[#F5EBE0]/60 text-[#5C5246] hover:bg-[#F5EBE0] border border-[#E6D5C3]/60'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`rounded-full ${lineWidth === lw.value ? 'bg-white' : 'bg-[#2D2D2D]'}`}
                      style={{
                        width: `${Math.min(lw.value / 1.5, 12)}px`,
                        height: `${Math.min(lw.value / 1.5, 12)}px`,
                      }}
                    />
                    {lw.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas Container */}
        <div
          ref={containerRef}
          className="relative w-full rounded-3xl overflow-hidden border-2 border-[#E6D5C3] shadow-inner bg-white touch-none cursor-crosshair group"
        >
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full block"
          />
          <div className="absolute bottom-3 right-3 px-3 py-1 bg-[#2D2D2D]/60 backdrop-blur-xs text-[11px] font-bold text-white rounded-full pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity">
            🖌️ 마우스/터치로 그림을 그려보세요
          </div>
        </div>
      </div>
    );
  }
);

DrawingCanvas.displayName = 'DrawingCanvas';
