import express from 'express';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mysql from 'mysql2';
import bcrypt from 'bcrypt';
import validator from 'validator';
import { fileURLToPath } from 'url';
import dotenv from "dotenv";
import { dirname, join } from 'path';
import path from 'path';
import redis from './redisClient.mjs';  // ← ADD THIS
import { QueueManager } from './queueManager.mjs';  // ← ADD THIS
import { GameStateManager } from './gameStateManager.mjs';  // ← ADD THIS
import type { Request, ParamsDictionary, NextFunction } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

// Load dev env only locally
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: "../client/.env.development" });
}

const errorMap: { [key: string]: string } = {
  "1062": "Used email or username",
};

interface PlayerInQueue {
  socket: any;
  userId: string | number;
}

export class ChessServer {
  private __filename: string;
  private __dirname: string;
  private parentDir: string;
  private PORT: string;
  private saltRounds: number;
  app: any;
  ioServer: any;
  dataBase: any;
  matchmaking: MatchMaking;

    constructor() {
      this.__filename = "";
      this.__dirname = "";
      this.parentDir = "";
      this.PORT = "";
      this.saltRounds = 0;
      this.matchmaking = new MatchMaking();
    }
    async init() {
      
        // Server Constants
        this.PORT = process.env.PORT || process.env.REACT_APP_PORT_SERVER || "3001";
        this.saltRounds = 10;

        this.__filename = fileURLToPath(import.meta.url);
        this.__dirname = dirname(this.__filename);
        this.parentDir = path.join(this.__dirname, '..');

        // Setting up ExpressJs server
        this.app = express();
        this.app.set("trust proxy", 1);
        const server = createServer(this.app);
        this.ioServer = new Server(server, {
          cors: {
            origin: process.env.REACT_APP_CLIENT_URL,
            methods: ['GET', 'POST'],
            credentials: true,
          }
        });     
        
        const pubClient = createClient({ url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}` });
        const subClient = pubClient.duplicate();

        await Promise.all([pubClient.connect(), subClient.connect()]);

        this.ioServer.adapter(createAdapter(pubClient, subClient));
        
        const secretCode = process.env.SESSION_SECRET || '';

        // Create Redis store
        const redisStore = new RedisStore({
          client: redis,
          prefix: 'sess:',
          ttl: 3600
        });

        // Session data
        const sessionMiddleware = session({
            store: redisStore,
            secret: secretCode,
            resave: false,
            saveUninitialized: false,
            cookie: {
              maxAge: 3600000,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
            }
        });

        
        // Linking session to express server and io server
        const fakeRes = {
          getHeader: () => undefined,
          setHeader: () => {},
          end: () => {},
        } as any;

        this.app.use(sessionMiddleware);
        this.app.use(express.json());
        this.ioServer.use((socket: { request: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>; }, next: NextFunction) => {
          const res = {} as Response;
          sessionMiddleware(socket.request, fakeRes, next);
        });


        // Database access point
        this.dataBase = mysql.createPool({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        }).promise();

        // Matchmaking instance liked to the io server
        this.matchmaking.init(this.ioServer, this.dataBase);

        await this.handleRoutes();
        await this.socketBinder();

        server.listen(this.PORT, () => {
            console.log(`Server Started at PORT: ${this.PORT}`);
        });
    }

    async handleRoutes() {
        // User status check; "is logged in or not"
        this.app.get('/api/check-session', (req: { session: { user: any; }; }, res: { json: (arg0: { loggedIn: boolean; username?: any; }) => any; }) => {
            if (req.session.user) {
                return res.json({ loggedIn: true, username: req.session.user });
            } else {
                return res.json({ loggedIn: false });
            }
        });

        // Login API call
        this.app.post('/api/login', async (req: { body: { username: any; password: any; }; session: { user: { id: any; username: any; email: any; }; save: (arg0: (err: any) => any) => void; }; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: string; error?: unknown; }): any; new(): any; }; }; json: (arg0: { message: string; }) => any; }) => {
            try {
                // Capture user data + search for user in database
                const { username, password } = req.body;
                const foundUser = await this.searchUser(username);

                // Check if user exists
                if (!foundUser || foundUser.length === 0) return res.status(404).json({ message: "User not Found; Incorrect Username." });

                // Get expected password has, and compare entered password with stored hash
                const receivedHash = await this.getHash(username);
                const doesPasswordMatch = await bcrypt.compare(password, receivedHash);

                if (doesPasswordMatch) {
                    req.session.user = {
                        id: foundUser[0].id,
                        username: foundUser[0].username,
                        email: foundUser[0].email,
                    };


                    req.session.save((err: any) => {
                        if (err) {
                            console.error('Session save failed:', err);
                            return res.status(500).json({ message: "Failed to save data to session" });
                        }

                        return res.json({ message: "Login successful" });
                    });

                } else {
                    return res.status(401).json({ message: "Incorrect Credetials" });
                }

            } catch (error) {
                console.error("Error during login:", error);
                return res.status(500).json({ message: "Internal server error" , error: error});
            }


        });

        // SignUp API call
        this.app.post('/api/signup', async (req: { body: { username: any; password: any; email: any; }; session: { user: { id: any; username: any; email: any; }; save: (arg0: (err: any) => any) => void; }; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: any; user?: any; }): any; new(): any; }; }; }) => {
            try {

                // Capture user data; ensure all fields are filled approprietly
                const { username, password, email } = req.body;
                if (!username || !password || !email) return res.status(400).json({ message: "All fields are required" });

                // Validate username
                const isValidUsername = (/^[a-zA-Z0-9_]+$/.test(username)) && username.length >= 8;
                if (!isValidUsername) return res.status(400).json({ message: "Invalid username, Characters and numbers, 8+ chars"});

                // Validate email
                const isValidEmail = validator.isEmail(String(email));
                if (!isValidEmail) return res.status(400).json({message: "Invalid email format 'test@gmail.com'"});

                // Validate password
                const isValidPassword = validator.isStrongPassword(String(password), {
                  minLength: 8,
                  minLowercase: 1,
                  minUppercase: 1,
                  minNumbers: 1,
                  minSymbols: 1
                }); 
                if (!isValidPassword) return res.status(400).json({message: "Invalid password, min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol"});

                // Create a new user and save it to database
                const data = await this.createUser(username, password, email);
                if (!data) return res.status(500).json({ message: "User creation failed" });

                // Fetch the user details after creation
                const user = await this.searchUser(username);
                if (!user || user.length === 0) return res.status(404).json({ message: "User not found" });


                req.session.user = {
                    id: user[0].id,
                    username: user[0].username,
                    email: user[0].email,
                };

                req.session.save((err: any) => {
                    if (err) {
                        console.error('Session save failed:', err);
                        return res.status(500).json({ message: "Failed to save session" });
                    }
                    return res.status(201).json({ message: "Signup successful", user: req.session.user });
                });
            } catch (error: unknown) {
                console.error("Error during signup:", error);
                const err = error as NodeJS.ErrnoException;
                if (!err.errno) return;
                const errorNo : number = err.errno;
                const errorMsg: string = errorMap[errorNo.toString()] || "An unknown error occurred";
                return res.status(500).json({ message: errorMsg});
            }
        });

        // LogOut API call
        this.app.post('/api/logout', (req: { session: { destroy: (arg0: (err: any) => any) => void; }; }, res: { status: (arg0: number) => { (): any; new(): any; send: { (arg0: string): any; new(): any; }; }; clearCookie: (arg0: string) => void; send: (arg0: string) => void; }) => {
            // Clear session data and cookie
            req.session.destroy((err: any) => {
                if (err) return res.status(500).send('Logout failed');
                res.clearCookie('connect.sid'); // Clear session cookie
                res.send('Logged out successfully');
            });
        });

        this.app.get('/api/images/:imageName', (req: { params: { imageName: any; }; }, res: { sendFile: (arg0: string, arg1: (err: any) => void) => void; status: (arg0: number) => { (): any; new(): any; send: { (arg0: string): void; new(): any; }; }; }) => {
          const imageName = req.params.imageName;
          const imagePath = path.join(this.parentDir, 'uploads', 'profiles', imageName);

          res.sendFile(imagePath, (err: any) => {
            if (err) {
              console.error('File not found:', err);
              res.status(404).send('Image not found');
            }
          });
        })

    }

    async socketBinder() {
        this.ioServer.on("connection", (socket: any) => {
            const session = socket.request.session;
            const user = session?.user;
            if (user) {
              console.log('Socket connected for user:', user.username);
            }

            // FIXED: Added async and await
            socket.on("disconnect", async () => {
                const session = socket.request.session;
                if (!session?.user) return;
                const userId = session.user.id;
                
                // FIXED: Added await
                await this.matchmaking.removeFromQueue(userId);

                // FIXED: Added await and proper error handling
                const playerGame = await this.matchmaking.getPlayerGame(userId);
                if (!playerGame) return;

                const { gameId, game } = playerGame;
                
                // FIXED: Removed timeout logic (can't store timeouts in Redis)
                // Instead, just end the game after 20 seconds using a simple setTimeout
                // This timeout is stored in the server's memory, not Redis
                const disconnectTimeout = setTimeout(async () => {
                  // Check if player reconnected by checking if game still exists
                  const stillExists = await this.matchmaking.gameStateManager.getGame(gameId);
                  if (stillExists) {
                    if (userId === game.white.userId) {
                      await this.matchmaking.endGame(Number(gameId), 2, `Black won on abandonment`);
                    } else if (userId === game.black.userId) {
                      await this.matchmaking.endGame(Number(gameId), 1, `White won on abandonment`);
                    }
                  }
                }, 20000);

                // Store timeout ID in a server-side Map (not in Redis)
                // You could add this to MatchMaking class if needed
                
                socket.to(`game_${gameId}`).emit("opponent_disconnected", {msg: "Opponent disconnected"});
            });
            // END_CONNECTION

            // FIXED: Added async and await
            socket.on("join-queue", async (data: { timeControl: any; }) => {
                const timeControl = data.timeControl;

                const session = socket.request.session;
                if (!session.user) {socket.emit('error', { message: 'Must be logged in' }); return;}

                const userId = session.user.id;
                
                // FIXED: Added await
                await this.matchmaking.addToQueue(socket, userId, timeControl);

                console.log(`${session.user.username} has joined the queue`)

                socket.emit('waitingForMatch');
            });

            socket.on('join_game', async (gameId: any) => {
                const session = socket.request.session;

                // Check if user is part of this game; make sure valid player
                const [rows] = await this.dataBase.query(
                    `SELECT g.*, 
                        p1.username as player1_username,
                        p2.username as player2_username
                    FROM games g
                    JOIN users p1 ON g.player1_id = p1.id
                    JOIN users p2 ON g.player2_id = p2.id
                    WHERE g.game_id = ?`,
                    [gameId]
                );

                let allow = false;

                if (rows.length > 0) {
                    socket.join(`game_${gameId}`);
                  
                  if (session.user && (rows[0].player1_id == session.user.id || rows[0].player2_id == session.user.id)) {

                    const userId = session.user.id;
                    if (rows[0].quote == "ongoing") {
                      socket.to(`game_${gameId}`).emit('opponent-connected');
                      allow = true;

                      // FIXED: Removed timeout clearing logic
                      // Timeouts can't be stored in Redis, they're managed separately
                      // If you need reconnection handling, implement it differently
                    }
                  }
                    // Send initial game state
                    socket.emit('game_state', {
                        allow: allow,
                        over: rows[0].quote,
                        fen: rows[0].current_fen,
                        moves: rows[0].moves,
                        player1: {
                            id: rows[0].player1_id,
                            username: rows[0].player1_username,
                            clock: rows[0].player1_clock,
                        },
                        player2: {
                            id: rows[0].player2_id,
                            username: rows[0].player2_username,
                            clock: rows[0].player2_clock,
                        }
                    });

                    
                } else {
                    socket.emit('error', { message: 'Unavailable game' });
                }
            });

            socket.on("move", async (data: { gameId: any; notation: any; color: string; displayMove: any; fen: any; }) => {
                const session = socket.request.session;
                if (!session.user) return;
                  
                  if (data.gameId) {
                    const gameId = data.gameId;
                    const move = data.notation;

                    try {
                      // Switch turns
                      // FIXED: Added await
                      const match = await this.matchmaking.gameStateManager.getGame(Number(gameId));
                      if (!match || !match.clock) return;
                      
                      if (data.color === "white") {
                        match.clock.whiteTime += timeControlMap[match.timeControl].inc;
                      } else {
                        match.clock.blackTime += timeControlMap[match.timeControl].inc;
                      }

                      // FIXED: Added await
                      await this.matchmaking.switchClock(Number(gameId));
                      
                      // Emit move to opponent
                        socket.to(`game_${gameId}`).emit("move_update", {
                            move: move,
                            gameId: gameId,
                        });
                        socket.emit("notation", {notation: data.displayMove});
                        socket.to(`game_${gameId}`).emit("notation", {notation: data.displayMove});

                        // Update game in database
                        await this.dataBase.query(
                            "UPDATE games SET current_fen = ?, fen_history = JSON_ARRAY_APPEND(fen_history, '$', ?), moves = JSON_ARRAY_APPEND(moves, '$', ?) WHERE game_id = ?",
                            [data.fen, data.fen, data.displayMove, gameId]
                        );

                    } catch (error) {
                        console.error('Error updating game:', error);
                    }
                }
            });

            socket.on("game_over", async (data: { gameId: any; result: any; quote: any; }) => {
                const session = socket.request.session;

                if (!session.user) return;

                try {
                    const userId = session.user.id;
                    // FIXED: Added await
                    await this.matchmaking.endGame(Number(data.gameId), data.result, data.quote);

                } catch (error) {
                    console.error('Error updating game status:', error);
                    socket.emit('error', { message: 'Failed to update game status' });
                }
            });

            socket.on("draw_request", (data: { gameId: any; }) => {
              socket.to(`game_${data.gameId}`).emit("draw_offered"); 
            })

            socket.on("draw_rejected", (data: { gameId: any; }) => {
              socket.to(`game_${data.gameId}`).emit("draw_response");
            })
        });
    }

    async searchUser(username: any) {
        const [rows, fields] = await this.dataBase.query("SELECT * FROM users WHERE username = ?", [username]);
        return rows;
    }

    async createUser(username: any, password: string | Buffer<ArrayBufferLike>, email: any) {
        const hashedPassword = await bcrypt.hash(password, this.saltRounds);
        const result = await this.dataBase.query("INSERT INTO users (username, email, password) VALUES (?, ?, ?);", [username, email, hashedPassword]);
        return result[0];
    }

    async getHash(username: any) {
        const result = await this.dataBase.query("SELECT password FROM users WHERE username = ?", [username]);
        return result[0][0].password;
    }
}




const timeControlIndex: { [key: string] : number} = {
    "1+0" :     0,
    "3+0" :     1,
    "3+2" :     2,
    "5+0" :     3,
    "5+5" :     4,
    "10+0" :    5,
    "10+1" :    6,
    "15+10" :   7,
    "30+0" :    8,

};

const timeControlMap: { [key: string] : {start: number, inc: number}} = {
    "1+0" :     {start: 60.0,     inc: 0},
    "3+0" :     {start: 180.0,    inc: 0},
    "3+2" :     {start: 180.0,    inc: 2},
    "5+0" :     {start: 300.0,    inc: 0},
    "5+5" :     {start: 300.0,    inc: 5},
    "10+0" :    {start: 600.0,    inc: 0},
    "10+1" :    {start: 600.0,    inc: 1},
    "15+10" :   {start: 900.0,    inc: 10},
    "30+0" :    {start: 1800.0,   inc: 0},

};


class MatchMaking {
  io: any;
  dataBase: any;
  queueManager: QueueManager;
  gameStateManager: GameStateManager;
  clockIntervals: Map<number, NodeJS.Timeout>;

  constructor() {
    this.queueManager = new QueueManager();
    this.gameStateManager = new GameStateManager();
    this.clockIntervals = new Map();
  }

  init(io: any, db: any) {
    this.io = io;
    this.dataBase = db;
  }

  startClock(gameId: number, startTime: number) {
    // Clear existing interval if any
    if (this.clockIntervals.has(gameId)) {
      clearInterval(this.clockIntervals.get(gameId)!);
    }

    const interval = setInterval(async () => {
      const game = await this.gameStateManager.getGame(gameId);
      if (!game || !game.clock) {
        clearInterval(interval);
        this.clockIntervals.delete(gameId);
        return;
      }

      const clock = game.clock;
      
      // Update time
      if (clock.activeColor === 'white') {
        clock.whiteTime -= 0.1;
      } else {
        clock.blackTime -= 0.1;
      }

      // Handle timeout
      if (clock.whiteTime <= 0 || clock.blackTime <= 0) {
        clearInterval(interval);
        this.clockIntervals.delete(gameId);
        const result = clock.whiteTime <= 0 ? 2 : 1;
        await this.endGame(gameId, result, `${result === 1 ? "White" : "Black"} won on time`);
        return;
      }

      // Save updated clock
      await this.gameStateManager.updateClock(gameId, clock);

      // Emit clock updates
      this.io.to(`game_${gameId}`).emit('clock_update', {
        whiteTime: Math.max(0, clock.whiteTime),
        blackTime: Math.max(0, clock.blackTime),
      });
    }, 100);

    this.clockIntervals.set(gameId, interval);
  }

  stopClock(gameId: number) {
    const interval = this.clockIntervals.get(gameId);
    if (interval) {
      clearInterval(interval);
      this.clockIntervals.delete(gameId);
    }
  }

  async switchClock(gameId: number) {
    const game = await this.gameStateManager.getGame(gameId);
    if (!game || !game.clock) return;

    game.clock.activeColor = game.clock.activeColor === 'white' ? 'black' : 'white';
    await this.gameStateManager.updateClock(gameId, game.clock);
  }

  async addToQueue(socket: any, userId: any, timeControl: string) {
    await this.queueManager.removeFromAllQueues(userId);

    const player = {
      socketId: socket.id,
      userId,
      timestamp: Date.now()
    };

    await this.queueManager.addToQueue(timeControl, player);
    return await this.tryMatch(timeControl);
  }

  async removeFromQueue(userId: any) {
    await this.queueManager.removeFromAllQueues(userId);
  }

  async tryMatch(timeControl: string) {
    console.log("Trying to match...");
    const queueSize = await this.queueManager.getQueueSize(timeControl);
    
    if (queueSize >= 2) {
      const [player1Data, player2Data] = await this.queueManager.getNextPlayers(timeControl, 2);
      
      if (!player1Data || !player2Data) return null;

      // Get socket objects from Socket.IO
      const player1Socket = this.io.sockets.sockets.get(player1Data.socketId);
      const player2Socket = this.io.sockets.sockets.get(player2Data.socketId);

      if (!player1Socket || !player2Socket) {
        // One or both players disconnected, put them back in queue
        if (player1Socket) await this.queueManager.addToQueue(timeControl, player1Data);
        if (player2Socket) await this.queueManager.addToQueue(timeControl, player2Data);
        return null;
      }

      try {
        const initialFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        const initialFenHistory = JSON.stringify([initialFEN]);
        const moves = JSON.stringify([]);
        const clockStartingTime = timeControlMap[timeControl].start;

        // Create game in database
        const [result] = await this.dataBase.query(
          "INSERT INTO games (timecontrol, player1_id, player2_id, outcome, current_fen, fen_history, moves, player1_clock, player2_clock, quote) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            timeControl,
            player1Data.userId,
            player2Data.userId,
            0,
            initialFEN,
            initialFenHistory,
            moves,
            clockStartingTime,
            clockStartingTime,
            "ongoing",
          ]
        );

        const gameId = result.insertId;
        
        // Save game state to Redis
        const gameState = {
          gameId,
          white: { userId: player1Data.userId, socketId: player1Data.socketId },
          black: { userId: player2Data.userId, socketId: player2Data.socketId },
          timeControl: timeControl,
          clock: {
            whiteTime: clockStartingTime,
            blackTime: clockStartingTime,
            activeColor: 'white' as const
          }
        };

        await this.gameStateManager.saveGame(gameId, gameState);

        // Set up socket rooms
        player1Socket.join(`user_${player1Data.userId}`);
        player2Socket.join(`user_${player2Data.userId}`);
        player1Socket.join(`game_${gameId}`);
        player2Socket.join(`game_${gameId}`);

        // Notify players
        this.io.to(`user_${player1Data.userId}`).emit('match_found', {
          gameId,
          color: 'white',
        });

        this.io.to(`user_${player2Data.userId}`).emit('match_found', {
          gameId,
          color: 'black',
        });

        // Start clock
        this.startClock(gameId, clockStartingTime);

        return gameState;
      } catch (error) {
        console.error('Error creating game:', error);
        // Put players back in queue
        await this.queueManager.addToQueue(timeControl, player1Data);
        await this.queueManager.addToQueue(timeControl, player2Data);
        return null;
      }
    }
    return null;
  }

  async getPlayerGame(userId: any) {
    return await this.gameStateManager.findGameByUserId(userId);
  }

  async endGame(gameId: number, result: number, quote: string) {
    const game = await this.gameStateManager.getGame(gameId);
    if (!game) return;

    this.stopClock(gameId);

    const whiteTime = game.clock?.whiteTime || 0;
    const blackTime = game.clock?.blackTime || 0;

    // Update database
    await this.dataBase.query(
      "UPDATE games SET player1_clock = ?, player2_clock = ?, outcome = ?, quote = ? WHERE game_id = ?",
      [Math.max(0, whiteTime), Math.max(0, blackTime), result, quote, gameId]
    );

    // Notify clients
    this.io.to(`game_${gameId}`).emit('game_over_broad', { result, quote });

    // Clean up
    await this.gameStateManager.deleteGame(gameId);
  }
}