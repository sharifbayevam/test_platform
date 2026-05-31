import React, { useState, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';

const ROW = 16;
const COL = 10;
const SHAPES = [
  [[1, 1, 1, 1]], // I
  [[1, 1, 1], [0, 1, 0]], // T
  [[1, 1, 1], [1, 0, 0]], // L
  [[1, 1], [1, 1]], // O
  [[1, 1, 0], [0, 1, 1]]  // Z
];

export default function Tetris({ darkMode }) {
  const [grid, setGrid] = useState(() => Array(ROW).fill(null).map(() => Array(COL).fill(0)));
  const [currentPiece, setCurrentPiece] = useState(null);
  const [piecePos, setPiecePos] = useState({ r: 0, c: 3 });
  const [gameScore, setGameScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameActive, setGameActive] = useState(false);

  const optionLetters = ['A', 'B', 'C', 'D'];

  const checkCollision = (shape, dr, dc, currentGrid) => {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const nr = piecePos.r + r + dr;
          const nc = piecePos.c + c + dc;
          if (nc < 0 || nc >= COL || nr >= ROW) return true;
          if (nr >= 0 && currentGrid[nr][nc]) return true;
        }
      }
    }
    return false;
  };

  const spawnPiece = useCallback((currentGrid) => {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const startCol = Math.floor((COL - shape[0].length) / 2);
    setCurrentPiece(shape);
    setPiecePos({ r: 0, c: startCol });
    
    if (checkCollision(shape, 0, startCol, currentGrid)) {
      setGameOver(true);
      setGameActive(false);
    }
  }, [piecePos]);

  const mergePiece = useCallback(() => {
    const newGrid = grid.map(row => [...row]);
    for (let r = 0; r < currentPiece.length; r++) {
      for (let c = 0; c < currentPiece[r].length; c++) {
        if (currentPiece[r][c]) {
          const nr = piecePos.r + r;
          const nc = piecePos.c + c;
          if (nr >= 0) newGrid[nr][nc] = 1;
        }
      }
    }

    let clearedRows = 0;
    const filteredGrid = newGrid.filter(row => {
      const isFull = row.every(cell => cell === 1);
      if (isFull) clearedRows++;
      return !isFull;
    });

    while (filteredGrid.length < ROW) {
      filteredGrid.unshift(Array(COL).fill(0));
    }

    setGameScore(s => s + clearedRows * 10);
    setGrid(filteredGrid);
    spawnPiece(filteredGrid);
  }, [grid, currentPiece, piecePos, spawnPiece]);

  const moveDown = useCallback(() => {
    if (!gameActive || gameOver || !currentPiece) return;
    if (!checkCollision(currentPiece, 1, 0, grid)) {
      setPiecePos(prev => ({ ...prev, r: prev.r + 1 }));
    } else {
      mergePiece();
    }
  }, [gameActive, gameOver, currentPiece, grid, mergePiece]);

  useEffect(() => {
    if (!gameActive || gameOver) return;
    const interval = setInterval(moveDown, 600);
    return () => clearInterval(interval);
  }, [gameActive, gameOver, moveDown]);

  const startNewGame = () => {
    const emptyGrid = Array(ROW).fill(null).map(() => Array(COL).fill(0));
    setGrid(emptyGrid);
    setGameScore(0);
    setGameOver(false);
    setGameActive(true);
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    setCurrentPiece(shape);
    setPiecePos({ r: 0, c: 3 });
  };

  const moveLeft = () => {
    if (gameActive && !checkCollision(currentPiece, 0, -1, grid)) {
      setPiecePos(prev => ({ ...prev, c: prev.c - 1 }));
    }
  };

  const moveRight = () => {
    if (gameActive && !checkCollision(currentPiece, 0, 1, grid)) {
      setPiecePos(prev => ({ ...prev, c: prev.c + 1 }));
    }
  };

  const rotatePiece = () => {
    if (!gameActive || !currentPiece) return;
    const rotated = currentPiece[0].map((_, index) => currentPiece.map(row => row[index])).reverse();
    if (!checkCollision(rotated, 0, 0, grid)) {
      setCurrentPiece(rotated);
    }
  };

  const renderGrid = () => {
    const displayGrid = grid.map(row => [...row]);
    if (currentPiece && gameActive && !gameOver) {
      for (let r = 0; r < currentPiece.length; r++) {
        for (let c = 0; c < currentPiece[r].length; c++) {
          if (currentPiece[r][c]) {
            const nr = piecePos.r + r;
            const nc = piecePos.c + c;
            if (nr >= 0 && nr < ROW && nc >= 0 && nc < COL) {
              displayGrid[nr][nc] = 2;
            }
          }
        }
      }
    }
    return displayGrid;
  };

  return (
    <div className={`max-w-md mx-auto text-center space-y-4 p-5 rounded-2xl border backdrop-blur-md transition-all ${
      darkMode ? 'bg-slate-900/90 border-slate-800 shadow-2xl text-slate-100' : 'bg-white border-slate-200 shadow-lg text-slate-900'
    }`}>
      <h2 className="text-lg font-black tracking-widest">🎮 RETRO MATNLI TETRIS</h2>
      <p className="text-amber-500 font-mono font-bold text-sm my-1">Ball: {gameScore}</p>
      {gameOver && <p className="text-rose-500 font-bold animate-bounce">O‘yin tugadi! (Game Over)</p>}
      
      <div className="grid grid-cols-10 gap-0.5 max-w-[210px] mx-auto bg-slate-950 p-2 rounded-lg border-2 border-slate-700 font-mono text-center shadow-inner">
        {renderGrid().map((row, rIdx) => 
          row.map((cell, cIdx) => (
            <div 
              key={`${rIdx}-${cIdx}`} 
              className={`w-4 h-4 rounded-sm text-[10px] flex items-center justify-center font-bold transition-all ${
                cell === 1 ? 'bg-indigo-600 text-white' : 
                cell === 2 ? 'bg-amber-400 text-slate-900' : 'bg-slate-900/40 text-slate-800'
              }`}
            >
              {cell > 0 ? '■' : '·'}
            </div>
          ))
        )}
      </div>

      <div className="mt-4 space-y-2">
        {!gameActive ? (
          <button onClick={startNewGame} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-2.5 rounded-xl text-xs uppercase cursor-pointer transition-all">
            O‘yinni Boshlash
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button onClick={rotatePiece} className="bg-slate-700 hover:bg-slate-600 text-white p-2 w-20 rounded-lg font-bold transition-all">▲ Burish</button>
            <div className="flex gap-4">
              <button onClick={moveLeft} className="bg-slate-700 hover:bg-slate-600 text-white p-2 w-16 rounded-lg font-bold transition-all">◀ Chap</button>
              <button onClick={moveRight} className="bg-slate-700 hover:bg-slate-600 text-white p-2 w-16 rounded-lg font-bold transition-all">O‘ng ▶</button>
            </div>
            <button onClick={moveDown} className="bg-slate-600 hover:bg-slate-500 text-white p-2 w-20 rounded-lg font-bold transition-all">▼ Pastga</button>
          </div>
        )}
      </div>
    </div>
  );
}