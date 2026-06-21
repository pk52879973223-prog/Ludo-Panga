// Game board rendering component for Android
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { PLAYERS, OUTER_PATH, HOME_STRETCHES, HOME_BASE_SLOTS, SAFE_CELLS, GRID, CELL_PX } from '../utils/constants';
import { Piece } from '../utils/gameLogic';

interface BoardProps {
  pieces: Record<number, Piece[]>;
  movablePieceIds: Set<number>;
  onPieceClick: (pieceId: number) => void;
  currentPlayer: number;
}

const GameBoard: React.FC<BoardProps> = ({
  pieces,
  movablePieceIds,
  onPieceClick,
  currentPlayer,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const boardSize = Math.min(screenWidth - 40, 510); // GRID(15) * CELL_PX(34) = 510
  const scale = boardSize / (GRID * CELL_PX);

  return (
    <View style={[styles.boardContainer, { width: boardSize, height: boardSize }]}>
      {/* Board Background */}
      <View style={styles.boardBackground} />

      {/* Grid Lines and Cells */}
      {renderBoard()}

      {/* Pieces */}
      {renderPieces()}

      {/* Center Diamond */}
      <View style={[styles.centerDiamond, { transform: [{ scale }] }]} />
    </View>
  );

  function renderBoard() {
    const cells = [];
    
    // Render outer path
    OUTER_PATH.forEach((coord, idx) => {
      const [r, c] = coord;
      const isSafe = SAFE_CELLS.has(idx);
      const isPlayerStart = PLAYERS.some(p => p.start === idx);
      const player = PLAYERS.find(p => p.start === idx);
      
      let bgColor = '#ffffff';
      if (isPlayerStart) {
        bgColor = player?.color || '#ffffff';
      }

      cells.push(
        <View
          key={`cell-${r}-${c}`}
          style={[
            styles.cell,
            {
              top: r * CELL_PX * scale,
              left: c * CELL_PX * scale,
              width: CELL_PX * scale,
              height: CELL_PX * scale,
              backgroundColor: bgColor,
            },
          ]}
        >
          {isSafe && <View style={styles.starIcon} />}
        </View>
      );
    });

    // Render home stretches
    Object.entries(HOME_STRETCHES).forEach(([pid, coords]) => {
      coords.forEach((coord, idx) => {
        const [r, c] = coord;
        const playerId = parseInt(pid);
        cells.push(
          <View
            key={`stretch-${pid}-${idx}`}
            style={[
              styles.cell,
              {
                top: r * CELL_PX * scale,
                left: c * CELL_PX * scale,
                width: CELL_PX * scale,
                height: CELL_PX * scale,
                backgroundColor: PLAYERS[playerId].color,
              },
            ]}
          />
        );
      });
    });

    // Render home bases (quadrants)
    PLAYERS.forEach((player) => {
      let baseR = 0, baseC = 0;
      switch (player.id) {
        case 0: baseR = 0; baseC = 0; break;
        case 1: baseR = 0; baseC = 9; break;
        case 2: baseR = 9; baseC = 9; break;
        case 3: baseR = 9; baseC = 0; break;
      }

      cells.push(
        <View
          key={`base-${player.id}`}
          style={[
            styles.homeBase,
            {
              top: baseR * CELL_PX * scale,
              left: baseC * CELL_PX * scale,
              width: 6 * CELL_PX * scale,
              height: 6 * CELL_PX * scale,
              backgroundColor: player.light,
              borderColor: player.color,
              borderWidth: 2 * scale,
            },
          ]}
        />
      );
    });

    return cells;
  }

  function renderPieces() {
    const pieceElements = [];
    const scale = boardSize / (GRID * CELL_PX);

    PLAYERS.forEach((player) => {
      pieces[player.id].forEach((piece, slotIdx) => {
        if (piece.state === 'finished') return;

        let r = 0, c = 0;

        if (piece.state === 'home') {
          const [sr, sc] = HOME_BASE_SLOTS[player.id][slotIdx % 4];
          r = sr;
          c = sc;
        } else if (piece.state === 'track') {
          const startIdx = player.start;
          const absIdx = (startIdx + piece.pos) % 52;
          const [sr, sc] = OUTER_PATH[absIdx];
          r = sr;
          c = sc;
        } else if (piece.state === 'stretch') {
          const [sr, sc] = HOME_STRETCHES[player.id][piece.pos];
          r = sr;
          c = sc;
        }

        const isMovable = player.id === currentPlayer && movablePieceIds.has(piece.id);

        pieceElements.push(
          <View
            key={`piece-${player.id}-${piece.id}`}
            style={[
              styles.piece,
              {
                top: (r * CELL_PX + CELL_PX / 2) * scale - 8 * scale,
                left: (c * CELL_PX + CELL_PX / 2) * scale - 8 * scale,
                width: 16 * scale,
                height: 16 * scale,
                backgroundColor: player.color,
                borderColor: isMovable ? '#ffff00' : '#fff',
                shadowColor: isMovable ? player.color : '#000',
                shadowOpacity: isMovable ? 0.8 : 0.3,
                shadowRadius: isMovable ? 8 : 3,
              },
            ]}
          />
        );
      });
    });

    return pieceElements;
  }
};

const styles = StyleSheet.create({
  boardContainer: {
    position: 'relative',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ccc',
  },
  boardBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
  },
  cell: {
    position: 'absolute',
    borderWidth: 0.5,
    borderColor: '#00000015',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starIcon: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffd500',
  },
  homeBase: {
    position: 'absolute',
    borderRadius: 8,
  },
  piece: {
    position: 'absolute',
    borderRadius: 8,
    borderWidth: 2,
  },
  centerDiamond: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 4,
    top: '50%',
    left: '50%',
    marginTop: -45,
    marginLeft: -45,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#ccc',
  },
});

export default GameBoard;
