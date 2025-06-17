import { useEffect, useState } from "react";
// @ts-ignore
import createChessModule from "../engine/chess.js";
import Board from "./Board";

interface GameProps {
    timeControl: string;
}

const Game: React.FC<GameProps> = ({timeControl}) => {
    const [game, setGame] = useState<any>(null);

    const fen = "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/P4N2/1PPP1PPP/RNBQK2R w KQkq - 1 5";

    useEffect (() => {
        async function loadModule() {
            try {
                const Module = await createChessModule();
                const Chess = Module.Chess;
                const game = new Chess();
                game.init(fen);
                setGame(game);
                // @ts-ignore
                window.game = game;
                console.log("Chess engine initialized");
            } catch (error) {
                console.error("Failed to load or initialize WebAssembly module:", error);
            }
        }
    loadModule();

    }, [])

    const makeMove = (move: string): [boolean, boolean, boolean, boolean, string] => {
        const moveMade = game.move(move);
        const displayNotation = moveMade.san;
        return [moveMade.status, moveMade.flags.includes("e"), moveMade.flags.includes("k"), moveMade.flags.includes("q"), displayNotation];
    }
    const checkGameOver = (): {isOver: boolean, result: number, quote: string} => {

        let result = 0;
        let quote = "";

        if (game.is_checkmate()) {
            quote = "Check Mate"
            result = game.get_turn() === "w" ? 2 : 1
            return {isOver: true, result: result, quote: quote}
            
        } else if (game.is_stalemate()) {
            quote = "Stale Mate"
            result = 0
            return {isOver: true, result: result, quote: quote}
        }

        return {isOver: false, result: result, quote: quote}

    }


    if (!game) {
        return <div>Loading....</div>;
    }

    return (
        <>
            <Board
                type=""
                size="85"
                fen={fen}
                getTurn={()=>game.get_turn()}
                getLegalMoves={()=>game.get_legal_moves()} 
                makeMove={makeMove} 
                undoMove={()=>game.undo_move()} 
                getFen={()=>game.get_fen()}
                checkGameOver={()=>checkGameOver()}
            />
        </>
    )
}


export default Game;