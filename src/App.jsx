import { useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import './App.css';

const SYMBOLS = {
  w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕' },
  b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛' },
};
const ORDER = { q: 0, r: 1, b: 2, n: 3, p: 4 };

function CapturedRow({ title, pieces }) {
  const sorted = [...pieces].sort((a, b) => ORDER[a.type] - ORDER[b.type]);
  return (
    <div className="captured-row">
      <div className="captured-title">{title}</div>
      <div className="captured-pieces">
        {sorted.map((p, i) => (
          <span key={i}>{SYMBOLS[p.color][p.type]}&#xFE0E;</span>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [game, setGame] = useState(new Chess());
  const [status, setStatus] = useState("White's turn");
  const [selected, setSelected] = useState(null);

  // Captured pieces, rebuilt from the move history
  const capturedByWhite = [];
  const capturedByBlack = [];
  game.history({ verbose: true }).forEach((m) => {
    if (m.captured) {
      if (m.color === 'w') capturedByWhite.push({ type: m.captured, color: 'b' });
      else capturedByBlack.push({ type: m.captured, color: 'w' });
    }
  });

  function makeMove(from, to) {
    const gameCopy = new Chess();
    gameCopy.loadPgn(game.pgn()); // keeps the full history

    try {
      const move = gameCopy.move({ from, to, promotion: 'q' });
      if (move === null) return false;

      setGame(gameCopy);
      updateStatus(gameCopy);
      setSelected(null);
      return true;
    } catch (error) {
      return false; // illegal move
    }
  }

  function onSquareClick({ square }) {
    const clicked = game.get(square);

    if (selected) {
      if (selected === square) {
        setSelected(null); // click the same piece again to deselect
        return;
      }
      if (makeMove(selected, square)) return; // legal move played
    }

    // select one of the current player's pieces, otherwise clear
    if (clicked && clicked.color === game.turn()) setSelected(square);
    else setSelected(null);
  }

  function updateStatus(currentGame) {
    if (currentGame.isCheckmate()) {
      setStatus(`Checkmate! ${currentGame.turn() === 'w' ? 'Black' : 'White'} wins!`);
    } else if (currentGame.isDraw()) {
      setStatus('Game Over: Draw!');
    } else {
      const turn = currentGame.turn() === 'w' ? 'White' : 'Black';
      const checkText = currentGame.inCheck() ? ' (Check!)' : '';
      setStatus(`${turn}'s turn${checkText}`);
    }
  }

  function resetGame() {
    setGame(new Chess());
    setStatus("White's turn");
    setSelected(null);
  }

  // Highlight the selected piece and its possible moves
  const squareStyles = {};
  if (selected) {
    squareStyles[selected] = { backgroundColor: 'rgba(255, 255, 0, 0.5)' };

    game.moves({ square: selected, verbose: true }).forEach((m) => {
      const isCapture = game.get(m.to) || m.flags.includes('e');
      squareStyles[m.to] = {
        background: isCapture
          ? 'radial-gradient(circle, transparent 60%, rgba(220, 40, 40, 0.7) 62%)'
          : 'radial-gradient(circle, rgba(0, 0, 0, 0.35) 22%, transparent 24%)',
      };
    });
  }

  return (
    <div className="app">
      <h2 className="status">{status}</h2>

      <div className="game">
        <div className="board">
          <Chessboard
            options={{
              position: game.fen(),
              allowDragging: false, // click only
              onSquareClick: onSquareClick,
              squareStyles: squareStyles,
              lightSquareStyle: {backgroundColor: '#ecf0f4' },
              darkSquareStyle: { backgroundColor: '#2d2e2f'}
            }}
          />
        </div>

        <div className="captured-panel">
          <CapturedRow title="Captured by Black" pieces={capturedByBlack} />
          <CapturedRow title="Captured by White" pieces={capturedByWhite} />
        </div>
      </div>

      <button className="reset-btn" onClick={resetGame}>
        Reset Game
      </button>
    </div>
  );
}