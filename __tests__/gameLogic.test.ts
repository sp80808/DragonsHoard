import { initializeGame, isGameOver, getEmptyCells, spawnTile, moveGrid } from '../services/gameLogic';
import { Direction, TileType } from '../types';

describe('gameLogic', () => {
  test('initializeGame creates valid game state', () => {
    const state = initializeGame(true);
    expect(state.grid.length).toBeGreaterThan(0);
    expect(state.level).toBe(1);
    expect(state.score).toBe(0);
  });

  test('getEmptyCells returns correct count', () => {
    const grid = [];
    const empty = getEmptyCells(grid, 4);
    expect(empty.length).toBe(16);
  });

  test('spawnTile adds tile to grid', () => {
    const grid = [];
    const newGrid = spawnTile(grid, 4, 1);
    expect(newGrid.length).toBe(1);
  });

  test('isGameOver detects full grid with no moves', () => {
    const grid = Array.from({ length: 16 }, (_, i) => ({
      id: `tile-${i}`,
      x: i % 4,
      y: Math.floor(i / 4),
      value: 2,
      type: TileType.NORMAL,
    }));
    expect(isGameOver(grid, 4)).toBe(true);
  });

  test('moveGrid returns valid result', () => {
    const state = initializeGame(true);
    const result = moveGrid(state.grid, Direction.UP, state.gridSize);
    expect(result).toHaveProperty('grid');
    expect(result).toHaveProperty('moved');
    expect(result).toHaveProperty('score');
  });
});
