import React, { useState, useEffect } from 'react';

const TicTacToeAI = () => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [gameStatus, setGameStatus] = useState('playing');
  const [aiThinking, setAiThinking] = useState(false);
  const [stats, setStats] = useState({ wins: 0, losses: 0, draws: 0 });
  const [difficulty, setDifficulty] = useState('hard');

  // Calculate winner
  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: [a, b, c] };
      }
    }
    return null;
  };

  // Minimax algorithm with Alpha-Beta Pruning
  const minimax = (squares, depth, isMaximizing, alpha = -Infinity, beta = Infinity) => {
    const result = calculateWinner(squares);
    
    if (result) {
      return result.winner === 'O' ? 10 - depth : depth - 10;
    }
    
    if (!squares.includes(null)) {
      return 0; // Draw
    }

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (squares[i] === null) {
          squares[i] = 'O';
          const evaluation = minimax(squares, depth + 1, false, alpha, beta);
          squares[i] = null;
          maxEval = Math.max(maxEval, evaluation);
          alpha = Math.max(alpha, evaluation);
          if (beta <= alpha) break; // Beta cutoff
        }
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (let i = 0; i < 9; i++) {
        if (squares[i] === null) {
          squares[i] = 'X';
          const evaluation = minimax(squares, depth + 1, true, alpha, beta);
          squares[i] = null;
          minEval = Math.min(minEval, evaluation);
          beta = Math.min(beta, evaluation);
          if (beta <= alpha) break; // Alpha cutoff
        }
      }
      return minEval;
    }
  };

  // Find best move for AI
  const findBestMove = (squares) => {
    let bestEval = -Infinity;
    let bestMove = null;
    const emptySquares = squares
      .map((val, idx) => val === null ? idx : null)
      .filter(val => val !== null);

    // Random move for easy mode
    if (difficulty === 'easy' && Math.random() < 0.5) {
      return emptySquares[Math.floor(Math.random() * emptySquares.length)];
    }

    for (let i = 0; i < 9; i++) {
      if (squares[i] === null) {
        squares[i] = 'O';
        const evaluation = minimax(squares, 0, false);
        squares[i] = null;
        if (evaluation > bestEval) {
          bestEval = evaluation;
          bestMove = i;
        }
      }
    }
    return bestMove;
  };

  // Handle AI move
  useEffect(() => {
    if (!isXNext && gameStatus === 'playing') {
      setAiThinking(true);
      const timer = setTimeout(() => {
        const newBoard = [...board];
        const move = findBestMove(newBoard);
        if (move !== null) {
          newBoard[move] = 'O';
          setBoard(newBoard);
          
          const result = calculateWinner(newBoard);
          if (result) {
            setGameStatus(result.winner === 'O' ? 'ai-win' : 'draw');
            setStats(prev => ({
              ...prev,
              losses: result.winner === 'O' ? prev.losses + 1 : prev.losses,
              draws: prev.draws + 1
            }));
          } else if (!newBoard.includes(null)) {
            setGameStatus('draw');
            setStats(prev => ({ ...prev, draws: prev.draws + 1 }));
          }
        }
        setIsXNext(true);
        setAiThinking(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isXNext, gameStatus, board, difficulty]);

  // Handle player click
  const handleClick = (index) => {
    if (board[index] || gameStatus !== 'playing' || !isXNext || aiThinking) return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);

    const result = calculateWinner(newBoard);
    if (result) {
      setGameStatus(result.winner === 'X' ? 'player-win' : 'draw');
      setStats(prev => ({ ...prev, wins: prev.wins + 1 }));
    } else if (!newBoard.includes(null)) {
      setGameStatus('draw');
      setStats(prev => ({ ...prev, draws: prev.draws + 1 }));
    } else {
      setIsXNext(false);
    }
  };

  // Reset game
  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setGameStatus('playing');
    setAiThinking(false);
  };

  const winner = calculateWinner(board);
  const isBoardFull = !board.includes(null);

  const getStatusMessage = () => {
    if (aiThinking) return '🤖 AI is thinking...';
    if (gameStatus === 'player-win') return '🎉 You won!';
    if (gameStatus === 'ai-win') return '🤖 AI wins!';
    if (gameStatus === 'draw') return '🤝 It\'s a draw!';
    return isXNext ? '👤 Your turn' : '🤖 AI turn';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">TIC-TAC-TOE AI</h1>
          <p className="text-slate-400">Challenge the unbeatable AI</p>
        </div>

        {/* Difficulty Selector */}
        <div className="bg-slate-800 rounded-lg p-4 mb-6 border border-slate-700">
          <label className="block text-sm font-medium text-slate-300 mb-3">Difficulty</label>
          <div className="flex gap-2">
            {['easy', 'hard'].map(mode => (
              <button
                key={mode}
                onClick={() => {
                  setDifficulty(mode);
                  resetGame();
                }}
                disabled={gameStatus === 'playing' && !isBoardFull && !aiThinking}
                className={`flex-1 py-2 px-3 rounded font-medium transition ${
                  difficulty === mode
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="text-center mb-6">
          <div className="text-2xl font-bold text-cyan-400">{getStatusMessage()}</div>
        </div>

        {/* Game Board */}
        <div className="bg-slate-800 rounded-lg p-1 mb-6 border border-slate-700 shadow-xl">
          <div className="grid grid-cols-3 gap-1 bg-slate-900 p-3 rounded">
            {board.map((value, index) => (
              <button
                key={index}
                onClick={() => handleClick(index)}
                disabled={gameStatus !== 'playing' || !isXNext || aiThinking}
                className={`h-20 text-4xl font-bold rounded transition transform ${
                  value === 'X'
                    ? 'bg-cyan-500 text-white'
                    : value === 'O'
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-700 hover:bg-slate-600'
                } ${!value && gameStatus === 'playing' && isXNext && !aiThinking ? 'cursor-pointer hover:scale-105' : 'cursor-default'} ${
                  winner && winner.line.includes(index) ? 'ring-2 ring-yellow-400' : ''
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Wins', value: stats.wins, color: 'text-cyan-400' },
            { label: 'Draws', value: stats.draws, color: 'text-yellow-400' },
            { label: 'Losses', value: stats.losses, color: 'text-orange-400' },
          ].map(stat => (
            <div
              key={stat.label}
              className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-center"
            >
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Reset Button */}
        <button
          onClick={resetGame}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-3 px-4 rounded-lg transition transform hover:scale-105 disabled:opacity-50"
        >
          {gameStatus === 'playing' ? 'New Game' : 'Play Again'}
        </button>

        {/* Algorithm Info */}
        <div className="mt-8 bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-sm font-bold text-slate-300 mb-2">⚙️ Algorithm</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The AI uses <strong>Minimax with Alpha-Beta Pruning</strong>. It explores all possible game states and evaluates positions where it maximizes its own score while minimizing the player's. Alpha-Beta pruning eliminates unnecessary branches for optimal performance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TicTacToeAI;
