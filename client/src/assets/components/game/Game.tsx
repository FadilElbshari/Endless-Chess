import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import socket from "@components/Socket";
// @ts-ignore
import createChessModule from "@engine/chess.js";
import Board from "@components/board/Board";
import "@styles/game.css";
import placeholder_img from "@images/placeholder.jpg";

interface GameProps {
}

const Game: React.FC<GameProps> = ({}) => {
    const [game, setGame] = useState<any>(null);
    const [isOver, setIsOver] = useState<string>('');
    const [buttonStatus, setButtonStatus] = useState<boolean>(false);
    const [allowed, setAllowed] = useState<boolean>(true);

    const resignBtnRef = useRef<HTMLButtonElement>(null);

    const { gameId, color } = useParams();
    const flip = color !== "white";

    const time1Ref = useRef<HTMLDivElement>(null);
    const time2Ref = useRef<HTMLDivElement>(null);

    const [fen, setFen] = useState<string | null>(null);
    const [username1, setUsername1] = useState<string | null>(null);
    const [username2, setUsername2] = useState<string | null>(null);
    const [time1, setTime1] = useState<number>(0);
    const [time2, setTime2] = useState<number>(0);

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
            if (data.over !== "ongoing") {
                setIsOver(data.over);
            }
        };

        socket.on("opponent-connected", () => {
            console.log("Opponent Connected");
        });
        socket.on("opponent_disconnected", () => {
            console.log("Opponent Disconnected");
        });

        socket.on("error", (data) => {
            console.log(data);
        })
        socket.on("game_state", handleGameState);
        socket.on("clock_update", (data) => {
            setTime1(data.whiteTime);
            setTime2(data.blackTime);
        });

        socket.on("draw_offered", ()=>{
            console.log("Draw Offered")
        })

        socket.on("game_over_broad", (data) => {
            console.log(data);
            if (!resignBtnRef.current) return;
            setButtonStatus(true);
            setIsOver(data.quote);
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
                console.log("Chess engine initialized");
            } catch (error) {
                console.error("Failed to load or initialize WebAssembly module:", error);
            }
        }
    loadModule();

    }, [fen])

    useEffect(() => {
        if (!time1Ref.current || !time2Ref.current) return;

        // time1Ref.current.textContent = flip ? formatTime(time2) : formatTime(time1);
        // time2Ref.current.textContent = flip ? formatTime(time1) : formatTime(time2);

    }, [time1, time2])

    useEffect(() => {
    if (!resignBtnRef.current) return;
        resignBtnRef.current.addEventListener("click", () => {
            const result = color === "white" ? 2 : 1
            const data = {
                gameId: gameId, isOver: true, result: result, quote: `${color === 'white' ? "Black" : "White"} Wins by Resignation`
            }
            socket.emit("game_over", data);
            if (!resignBtnRef.current) return;
            setButtonStatus(true);
        });
    }, [resignBtnRef.current])

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

    return (
        <>
            <div className="game-container">
                <div className="board-section">
                    <div className="player-info top">
                        <div className="profile-pic">
                            <img src={placeholder_img}/>
                        </div>
                        <div className="player-details">
                            <span className="username">{flip ? username2 : username1}</span>
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

                    {(isOver !== '') &&
                    <div className="end-container hide" id="end">
                        {isOver}
                        <div className="buttons-container">
                            <button onClick={()=>window.location.href="/play"}>Back to Play</button>
                            <button disabled={buttonStatus}>Offer Rematch</button>
                        </div>
                    </div>
                    }
                    
                    <div className="player-info bottom">
                        <div className="profile-pic">
                            <img src={placeholder_img}/>
                        </div>
                        <div className="player-details">
                            <span className="username">{flip ? username1 : username2}</span>
                            <span className="rating">0000</span>
                        </div>
                        {/* <div className="connection"></div> */}
                        <div className={`clock${!flip ? " white" : " black"}`} ref={time1Ref}>{flip ? formatTime(time2) : formatTime(time1)}</div>
                    </div>
                </div>
                    <div className="moves-buttons-container" id="moves">
                        <div className="resign-draw-buttons">
                            <button className="game-btn" ref={resignBtnRef} disabled={buttonStatus}>Resign</button>
                            <button className="game-btn" disabled={buttonStatus} onClick={() => {
                                socket.emit("draw_request", {gameId});
                            }}>Draw</button>
                        </div>
                        <div className="move-history" id="history">
                            <ul id="moves-list">
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