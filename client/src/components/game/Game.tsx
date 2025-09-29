import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import socket from "@components/Socket";
// @ts-ignore
import createChessModule from "@engine/chess.js";
import Board from "@components/board/Board";
import "@styles/game.css";
import NavBar from "@components/home-components/Nav";

interface GameProps {
}

const Game: React.FC<GameProps> = ({}) => {

    const [game, setGame] = useState<any>(null);
    const [isOver, setIsOver] = useState<string>('');
    const [buttonStatus, setButtonStatus] = useState<boolean>(false);
    const [allowed, setAllowed] = useState<boolean>(true);

    const [moveCount, setMoveCount] = useState<number>(0);
    const [moves, setMoves] = useState<string[]>([]);

    const [isOpponentConnected, setIsOpponentConnected] = useState<boolean>(true);

    const resignBtnRef = useRef<HTMLButtonElement>(null);
    const drawBtnRef = useRef<HTMLButtonElement>(null);

    const { gameId, color } = useParams();
    const flip = color !== "white";

    const time1Ref = useRef<HTMLDivElement>(null);
    const time2Ref = useRef<HTMLDivElement>(null);

    const [fen, setFen] = useState<string | null>(null);
    const [username1, setUsername1] = useState<string | null>(null);
    const [username2, setUsername2] = useState<string | null>(null);
    const [time1, setTime1] = useState<number>(0);
    const [time2, setTime2] = useState<number>(0);

    const [isDrawOffered, setIsDrawOffered] = useState<boolean>(false);

    const [showOverOverlay, setShowOverOverlay] = useState<boolean>(false);


    useEffect(() => {
        socket.emit("join_game", gameId);
        console.log("joined")

        const handleGameState = (data: any) => {
            setFen(data.fen);
            setUsername1(data.player1.username);
            setUsername2(data.player2.username);
            setTime1(data.player1.clock);
            setTime2(data.player2.clock);
            setAllowed(data.allow);
            setButtonStatus(data.allow);
            const moveHistory = JSON.parse(data.moves);
            setMoveCount(moveHistory.length)
            setMoves(moveHistory);

            if (data.over !== "ongoing") {
                setIsOver(data.over);
                setShowOverOverlay(true);
            }
        };

        socket.on("opponent-connected", () => {
            setIsOpponentConnected(true);
            console.log("Connected")
        });
        socket.on("opponent_disconnected", () => {
            setIsOpponentConnected(false);
            console.log("Disonnected")
        });

        socket.on("error", (data) => {
            console.log(data);
        })
        socket.on("game_state", handleGameState);
        socket.on("clock_update", (data) => {
            setTime1(data.whiteTime);
            setTime2(data.blackTime);
        });

        socket.on("draw_offered", () => {
            setIsDrawOffered(true);
        })

        socket.on("draw_response", () => {
            if (!drawBtnRef.current) return;
            drawBtnRef.current.disabled = false;
        })

        socket.on("notation", (data) => {
            let newMoves = moves;
            console.log(newMoves);
            newMoves.push(data.notation);
            setMoves(newMoves);
        })

        socket.on("game_over_broad", (data) => {
            if (!resignBtnRef.current) return;
            setButtonStatus(true);
            setIsOver(data.quote);
            setShowOverOverlay(true);
            setAllowed(false);
        });

        return () => {
            socket.off("game_state", handleGameState); // Clean up listener
        };
    }, []);

    useEffect (() => {
        if (!fen) return;
        async function loadModule() {
            try {
                const Module = await createChessModule();
                const Chess = Module.Chess;
                const game = new Chess();
                game.init(fen);
                setGame(game);
            } catch (error) {
                console.error("Failed to load or initialize WebAssembly module:", error);
            }
        }
    loadModule();

    }, [fen])

    useEffect(() => {
        if (!time1Ref.current || !time2Ref.current) return;

    }, [time1, time2])

    const makeMove = (move: string, isUpdate=false): [boolean, boolean, boolean, boolean, string] => {
        const moveMade = game.move(move);
        const fen = game.get_fen();
        const displayNotation = moveMade.san;
        if (moveMade.status && !isUpdate) socket.emit("move", { gameId: gameId, notation: move, fen, displayMove: displayNotation, color: color });
        return [moveMade.status, moveMade.flags.includes("e"), moveMade.flags.includes("k"), moveMade.flags.includes("q"), displayNotation];
    }
    const checkGameOver = (): {isOver: boolean, result: number, quote: string} => {

        let result = 0;
        let quote = "";

        if (game.is_checkmate()) {
            quote = `${game.get_turn() === "w" ? "Black" : "White"} Wins by Check Mate`
            result = game.get_turn() === "w" ? 2 : 1
            const data = {
                gameId: gameId, isOver: true, result: result, quote: quote
            }
            socket.emit("game_over", data);
            return data;

        } else if (game.is_stalemate()) {
            quote = "Stale Mate"
            result = 0
            const data = {
                gameId: gameId, isOver: true, result: result, quote: quote
            }
            socket.emit("game_over", data);
            return data;
        }

        return {isOver: false, result: result, quote: quote}

    }


    if (!game || !fen || !username1 || !username2 || flip===null) {
        return <div>Loading....</div>;
    }

    const parseMoves= (moves: string[]): string[] => {
        let finalList: string[] = [];
        let count = 1;
        let str = "";
        for (let i=0; i<moves.length; i++) {
            const move = moves[i];
            if (i === moves.length-1 && i%2==0) {
                finalList.push(`${count}. ${move}`)
            } else if (i%2==0) {
                str = `${count++}. ${move}`;
            } else {
                str = str.concat(` ${move}`);
                finalList.push(str);
            }

        }
        return finalList;
    }

    return (
        <>
            <NavBar />
            <div className="game-container">
                <div className="board-section">
                    <div className="player-info top">
                        <div className="profile-pic">
                            <img src="/api/images/placeholder.jpg"/>
                        </div>
                        <div className="player-details">
                            <span className="username">{flip ? username1 : username2}</span>
                            <span className="rating">0000</span>
                        </div>
                        {/* <div className="connection"></div> */}
                        <div className={`clock${flip ? " white" : " black"}`} ref={time2Ref}>{flip ? formatTime(time1) : formatTime(time2)}</div>
                    </div>

                    <Board
                        allow={allowed}
                        type=""
                        size="75"
                        flip={color !== "white"}
                        fen={fen}
                        color={color==="white" ? 'w' : 'b'}
                        gameId={Number(gameId)}
                        getTurn={()=>game.get_turn()}
                        getLegalMoves={()=>game.get_legal_moves()}
                        makeMove={makeMove}
                        undoMove={()=>game.undo_move()}
                        getFen={()=>game.get_fen()}
                        checkGameOver={()=>checkGameOver()}
                    />

                    {showOverOverlay &&
                    <div className="end-container hide" id="end">
                        <button id="closing-button" onClick={()=>setShowOverOverlay(false)}>x</button>
                        {isOver}
                        <div className="buttons-container">
                            <button onClick={()=>window.location.href="/play"}>Back to Play</button>
                            {/* <button disabled={!isOpponentConnected}>Offer Rematch</button> */}
                        </div>
                    </div>
                    }

                    <div className="player-info bottom">
                        <div className="profile-pic">
                            <img src="/api/images/placeholder.jpg"/>
                        </div>
                        <div className="player-details">
                            <span className="username">{flip ? username2 : username1}</span>
                            <span className="rating">0000</span>
                        </div>
                        {/* <div className="connection"></div> */}
                        <div className={`clock${!flip ? " white" : " black"}`} ref={time1Ref}>{flip ? formatTime(time2) : formatTime(time1)}</div>
                    </div>
                </div>
                    <div className="moves-buttons-container" id="moves">
                        <div className="resign-draw-buttons">
                            <button className="game-btn" ref={resignBtnRef} disabled={!buttonStatus} onClick={!isDrawOffered ? () => {
                                const result = color === "white" ? 2 : 1
                                const data = {
                                    gameId: gameId, isOver: true, result: result, quote: `${color === 'white' ? "Black" : "White"} Wins by Resignation`
                                }
                                socket.emit("game_over", data);
                                if (!resignBtnRef.current) return;
                                setButtonStatus(true);
                            } : () => {
                                socket.emit("draw_rejected", {gameId});
                                setIsDrawOffered(false);
                            }}>{isDrawOffered ? "Reject" : "Resign"}</button>


                            <button className="game-btn" ref={drawBtnRef} disabled={!buttonStatus} onClick={!isDrawOffered ? () => {
                                socket.emit("draw_request", {gameId});
                                if (!drawBtnRef.current) return;
                                drawBtnRef.current.disabled = true;
                            } : () => {
                                const data = {
                                    gameId: gameId, isOver: true, result: 0, quote: "Game is drawn by agreement"
                                }
                                socket.emit("game_over", data);
                                setIsDrawOffered(false);
                            }}>{isDrawOffered ? "Accept" : "Draw"}</button>
                        </div>


                        <div className="move-history" id="history">
                            <ul id="moves-list">
                                {moves.length> 0 && parseMoves(moves).map((move, index) => (
                                    <li key={index}>{move}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
            </div>

        </>
    )
}


const formatTime = (seconds: number) => {
    const dec = 10 * Number((seconds - Math.floor(seconds)).toFixed(1));
    const minutes = Math.floor(Math.floor(seconds) / 60);
    const secs = Math.floor(seconds) % 60;
    return `${minutes < 10 ? `0${minutes}` : `${minutes}`}:${secs < 10 ? '0' : ''}${secs}:${dec < 10 ? `0${dec}` : `${dec}`}`;
}


export default Game;