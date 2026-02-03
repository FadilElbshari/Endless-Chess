import redis from './redisClient.mjs';

interface PlayerInQueue {
  socketId: string;
  userId: string | number;
  timestamp: number;
}

export class QueueManager {
  private readonly QUEUE_PREFIX = 'queue:';
  private readonly QUEUE_TTL = 300;

  async addToQueue(timeControl: string, player: PlayerInQueue): Promise<void> {
    const key = `${this.QUEUE_PREFIX}${timeControl}`;
    await redis.zadd(key, player.timestamp, JSON.stringify(player));
    await redis.expire(key, this.QUEUE_TTL);
    console.log(`✅ Added player ${player.userId} to queue ${timeControl}`);
  }

  async removeFromQueue(timeControl: string, userId: string | number): Promise<void> {
    const key = `${this.QUEUE_PREFIX}${timeControl}`;
    const members = await redis.zrange(key, 0, -1);
    
    for (const member of members) {
      const player = JSON.parse(member);
      if (player.userId === userId) {
        await redis.zrem(key, member);
      }
    }
  }

  async removeFromAllQueues(userId: string | number): Promise<void> {
    const timeControls = ["1+0", "3+0", "3+2", "5+0", "5+5", "10+0", "10+1", "15+10", "30+0"];
    
    for (const tc of timeControls) {
      await this.removeFromQueue(tc, userId);
    }
  }

  async getQueueSize(timeControl: string): Promise<number> {
    const key = `${this.QUEUE_PREFIX}${timeControl}`;
    return await redis.zcard(key);
  }

  async getNextPlayers(timeControl: string, count: number = 2): Promise<PlayerInQueue[]> {
    const key = `${this.QUEUE_PREFIX}${timeControl}`;
    const members = await redis.zrange(key, 0, count - 1);
    
    const players: PlayerInQueue[] = [];
    for (const member of members) {
      players.push(JSON.parse(member));
      await redis.zrem(key, member);
    }
    
    return players;
  }
}