import "@styles/board.css";
interface BoardProps {
    allow: boolean;
    type: string;
    size: string;
    fen: string;
    flip?: boolean;
    color: string;
    gameId: number;
    getTurn: () => string;
    getLegalMoves: () => any;
    makeMove: (move: string, isUpdate: boolean) => any;
    undoMove: () => void;
    getFen: () => string;
    checkGameOver: () => {
        isOver: boolean;
        result: number;
        quote: string;
    };
}
declare const Board: React.FC<BoardProps>;
export default Board;
