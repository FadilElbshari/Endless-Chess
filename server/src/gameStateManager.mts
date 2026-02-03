import redis from './redisClient.mjs';

interface GameClock {
  whiteTime: number;
  blackTime: number;
  activeColor: 'white' | 'black';
}

interface GameState {
  gameId: number;
  white: { userId: string | number; socketId: string };
  black: { userId: string | number; socketId: string };
  timeControl: string;
  clock?: GameClock;
}

export class GameStateManager {
  private readonly GAME_PREFIX = 'game:';
  private readonly GAME_TTL = 7200;

  async saveGame(gameId: number, state: GameState): Promise<void> {
    const key = `${this.GAME_PREFIX}${gameId}`;
    await redis.set(key, JSON.stringify(state), 'EX', this.GAME_TTL);
    console.log(`✅ Saved game ${gameId} to Redis`);
  }

  async getGame(gameId: number): Promise<GameState | null> {
    const key = `${this.GAME_PREFIX}${gameId}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteGame(gameId: number): Promise<void> {
    const key = `${this.GAME_PREFIX}${gameId}`;
    await redis.del(key);
    console.log(`✅ Deleted game ${gameId} from Redis`);
  }

  async updateClock(gameId: number, clock: GameClock): Promise<void> {
    const game = await this.getGame(gameId);
    if (game) {
      game.clock = clock;
      await this.saveGame(gameId, game);
    }
  }

  async findGameByUserId(userId: string | number): Promise<{ gameId: number; game: GameState } | null> {
    const keys = await redis.keys(`${this.GAME_PREFIX}*`);
    
    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        const game: GameState = JSON.parse(data);
        if (game.white.userId === userId || game.black.userId === userId) {
          const gameId = parseInt(key.replace(this.GAME_PREFIX, ''));
          return { gameId, game };
        }
      }
    }
    
    return null;
  }
}