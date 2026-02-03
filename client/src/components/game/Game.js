import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import socket from "@components/Socket";
// @ts-ignore
import createChessModule from "@engine/chess.js";
import Board from "@components/board/Board";
import "@styles/game.css";
import NavBar from "@components/home-components/Nav";
const Game = ({}) => {
    const [game, setGame] = useState(null);
    const [isOver, setIsOver] = useState('');
    const [buttonStatus, setButtonStatus] = useState(false);
    const [allowed, setAllowed] = useState(true);
    const [moveCount, setMoveCount] = useState(0);
    const [moves, setMoves] = useState([]);
    const [isOpponentConnected, setIsOpponentConnected] = useState(true);
    const resignBtnRef = useRef(null);
    const drawBtnRef = useRef(null);
    const { gameId, color } = useParams();
    const flip = color !== "white";
    const time1Ref = useRef(null);
    const time2Ref = useRef(null);
    const [fen, setFen] = useState(null);
    const [username1, setUsername1] = useState(null);
    const [username2, setUsername2] = useState(null);
    const [time1, setTime1] = useState(0);
    const [time2, setTime2] = useState(0);
    const [isDrawOffered, setIsDrawOffered] = useState(false);
    const [showOverOverlay, setShowOverOverlay] = useState(false);
    useEffect(() => {
        socket.emit("join_game", gameId);
        console.log("joined");
        console.log(moveCount);
        console.log(isOpponentConnected);
        const handleGameState = (data) => {
            setFen(data.fen);
            setUsername1(data.player1.username);
            setUsername2(data.player2.username);
            setTime1(data.player1.clock);
            setTime2(data.player2.clock);
            setAllowed(data.allow);
            setButtonStatus(data.allow);
            const moveHistory = JSON.parse(data.moves);
            setMoveCount(moveHistory.length);
            setMoves(moveHistory);
            if (data.over !== "ongoing") {
                setIsOver(data.over);
                setShowOverOverlay(true);
            }
        };
        socket.on("opponent-connected", () => {
            setIsOpponentConnected(true);
            console.log("Connected");
        });
        socket.on("opponent_disconnected", () => {
            setIsOpponentConnected(false);
            console.log("Disonnected");
        });
        socket.on("error", (data) => {
            console.log(data);
        });
        socket.on("game_state", handleGameState);
        socket.on("clock_update", (data) => {
            setTime1(data.whiteTime);
            setTime2(data.blackTime);
        });
        socket.on("draw_offered", () => {
            setIsDrawOffered(true);
        });
        socket.on("draw_response", () => {
            if (!drawBtnRef.current)
                return;
            drawBtnRef.current.disabled = false;
        });
        socket.on("notation", (data) => {
            let newMoves = moves;
            console.log(newMoves);
            newMoves.push(data.notation);
            setMoves(newMoves);
        });
        socket.on("game_over_broad", (data) => {
            if (!resignBtnRef.current)
                return;
            setButtonStatus(true);
            setIsOver(data.quote);
            setShowOverOverlay(true);
            setAllowed(false);
        });
        return () => {
            socket.off("game_state", handleGameState); // Clean up listener
        };
    }, []);
    useEffect(() => {
        if (!fen)
            return;
        async function loadModule() {
            try {
                const Module = await createChessModule();
                const Chess = Module.Chess;
                const game = new Chess();
                game.init(fen);
                setGame(game);
            }
            catch (error) {
                console.error("Failed to load or initialize WebAssembly module:", error);
            }
        }
        loadModule();
    }, [fen]);
    useEffect(() => {
        if (!time1Ref.current || !time2Ref.current)
            return;
    }, [time1, time2]);
    const makeMove = (move, isUpdate = false) => {
        const moveMade = game.move(move);
        const fen = game.get_fen();
        const displayNotation = moveMade.san;
        if (moveMade.status && !isUpdate)
            socket.emit("move", { gameId: gameId, notation: move, fen, displayMove: displayNotation, color: color });
        return [moveMade.status, moveMade.flags.includes("e"), moveMade.flags.includes("k"), moveMade.flags.includes("q"), displayNotation];
    };
    const checkGameOver = () => {
        let result = 0;
        let quote = "";
        if (game.is_checkmate()) {
            quote = `${game.get_turn() === "w" ? "Black" : "White"} Wins by Check Mate`;
            result = game.get_turn() === "w" ? 2 : 1;
            const data = {
                gameId: gameId, isOver: true, result: result, quote: quote
            };
            socket.emit("game_over", data);
            return data;
        }
        else if (game.is_stalemate()) {
            quote = "Stale Mate";
            result = 0;
            const data = {
                gameId: gameId, isOver: true, result: result, quote: quote
            };
            socket.emit("game_over", data);
            return data;
        }
        return { isOver: false, result: result, quote: quote };
    };
    if (!game || !fen || !username1 || !username2 || flip === null) {
        return _jsx("div", { children: "Loading...." });
    }
    const parseMoves = (moves) => {
        let finalList = [];
        let count = 1;
        let str = "";
        for (let i = 0; i < moves.length; i++) {
            const move = moves[i];
            if (i === moves.length - 1 && i % 2 == 0) {
                finalList.push(`${count}. ${move}`);
            }
            else if (i % 2 == 0) {
                str = `${count++}. ${move}`;
            }
            else {
                str = str.concat(` ${move}`);
                finalList.push(str);
            }
        }
        return finalList;
    };
    return (_jsxs(_Fragment, { children: [_jsx(NavBar, {}), _jsxs("div", { className: "game-container", children: [_jsxs("div", { className: "board-section", children: [_jsxs("div", { className: "player-info top", children: [_jsx("div", { className: "profile-pic", children: _jsx("img", { src: "/api/images/placeholder.jpg" }) }), _jsxs("div", { className: "player-details", children: [_jsx("span", { className: "username", children: flip ? username1 : username2 }), _jsx("span", { className: "rating", children: "0000" })] }), _jsx("div", { className: `clock${flip ? " white" : " black"}`, ref: time2Ref, children: flip ? formatTime(time1) : formatTime(time2) })] }), _jsx(Board, { allow: allowed, type: "", size: "75", flip: color !== "white", fen: fen, color: color === "white" ? 'w' : 'b', gameId: Number(gameId), getTurn: () => game.get_turn(), getLegalMoves: () => game.get_legal_moves(), makeMove: makeMove, undoMove: () => game.undo_move(), getFen: () => game.get_fen(), checkGameOver: () => checkGameOver() }), showOverOverlay &&
                                _jsxs("div", { className: "end-container hide", id: "end", children: [_jsx("button", { id: "closing-button", onClick: () => setShowOverOverlay(false), children: "x" }), isOver, _jsx("div", { className: "buttons-container", children: _jsx("button", { onClick: () => window.location.href = "/play", children: "Back to Play" }) })] }), _jsxs("div", { className: "player-info bottom", children: [_jsx("div", { className: "profile-pic", children: _jsx("img", { src: "/api/images/placeholder.jpg" }) }), _jsxs("div", { className: "player-details", children: [_jsx("span", { className: "username", children: flip ? username2 : username1 }), _jsx("span", { className: "rating", children: "0000" })] }), _jsx("div", { className: `clock${!flip ? " white" : " black"}`, ref: time1Ref, children: flip ? formatTime(time2) : formatTime(time1) })] })] }), _jsxs("div", { className: "moves-buttons-container", id: "moves", children: [_jsxs("div", { className: "resign-draw-buttons", children: [_jsx("button", { className: "game-btn", ref: resignBtnRef, disabled: !buttonStatus, onClick: !isDrawOffered ? () => {
                                            const result = color === "white" ? 2 : 1;
                                            const data = {
                                                gameId: gameId, isOver: true, result: result, quote: `${color === 'white' ? "Black" : "White"} Wins by Resignation`
                                            };
                                            socket.emit("game_over", data);
                                            if (!resignBtnRef.current)
                                                return;
                                            setButtonStatus(true);
                                        } : () => {
                                            socket.emit("draw_rejected", { gameId });
                                            setIsDrawOffered(false);
                                        }, children: isDrawOffered ? "Reject" : "Resign" }), _jsx("button", { className: "game-btn", ref: drawBtnRef, disabled: !buttonStatus, onClick: !isDrawOffered ? () => {
                                            socket.emit("draw_request", { gameId });
                                            if (!drawBtnRef.current)
                                                return;
                                            drawBtnRef.current.disabled = true;
                                        } : () => {
                                            const data = {
                                                gameId: gameId, isOver: true, result: 0, quote: "Game is drawn by agreement"
                                            };
                                            socket.emit("game_over", data);
                                            setIsDrawOffered(false);
                                        }, children: isDrawOffered ? "Accept" : "Draw" })] }), _jsx("div", { className: "move-history", id: "history", children: _jsx("ul", { id: "moves-list", children: moves.length > 0 && parseMoves(moves).map((move, index) => (_jsx("li", { children: move }, index))) }) })] })] })] }));
};
const formatTime = (seconds) => {
    const dec = 10 * Number((seconds - Math.floor(seconds)).toFixed(1));
    const minutes = Math.floor(Math.floor(seconds) / 60);
    const secs = Math.floor(seconds) % 60;
    return `${minutes < 10 ? `0${minutes}` : `${minutes}`}:${secs < 10 ? '0' : ''}${secs}:${dec < 10 ? `0${dec}` : `${dec}`}`;
};
export default Game;
