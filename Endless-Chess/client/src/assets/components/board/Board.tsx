import { useEffect, useRef, useCallback } from "react";
import "@styles/board.css";
import socket from "@components/Socket";

import pawn_w from '@images/chess/pawn_w.png';
import bishop_w from '@images/chess/bishop_w.png';
import knight_w from '@images/chess/knight_w.png';
import rook_w from '@images/chess/rook_w.png';
import queen_w from '@images/chess/queen_w.png';
import king_w from '@images/chess/king_w.png';

import pawn_b from '@images/chess/pawn_b.png';
import bishop_b from '@images/chess/bishop_b.png';
import knight_b from '@images/chess/knight_b.png';
import rook_b from '@images/chess/rook_b.png';
import queen_b from '@images/chess/queen_b.png';
import king_b from '@images/chess/king_b.png';

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
  checkGameOver: () => {isOver: boolean, result: number, quote: string};

}

interface PieceData {
  img?: string;
  id?: string;

}

const pieceImages = {
  w: {
    pawn: `url(${pawn_w})`,
    bishop: `url(${bishop_w})`,
    knight: `url(${knight_w})`,
    rook: `url(${rook_w})`,
    queen: `url(${queen_w})`,
    king: `url(${king_w})`,
  },
  b: {
    pawn: `url(${pawn_b})`,
    bishop: `url(${bishop_b})`,
    knight: `url(${knight_b})`,
    rook: `url(${rook_b})`,
    queen: `url(${queen_b})`,
    king: `url(${king_b})`,
  },
};

const SELECT = 0;
const DRAG = 1;
const UPDATE = 2;

const SHORT = 0;
const LONG = 1;

// const WHITE = 1;
// const BLACK = 0;

const letters = "abcdefgh";
// const pieces = "rnbqkRNBQKpP";
// const nums = "12345678";

// @ts-ignore
const Board: React.FC<BoardProps> = ({allow, type, size, fen, flip=false, color, gameId, getTurn, getLegalMoves, makeMove, undoMove, getFen, checkGameOver}) => {


  const boardRef = useRef<HTMLDivElement>(null);
  const squareRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const draggedPieceRef = useRef<HTMLElement | null>(null);
  const selectedPieceRef = useRef<HTMLElement | null>(null);

  const legalMoveSquaresRef = useRef<HTMLElement[]>([]);

  const RookSquaresRefs = useRef<[HTMLElement | null, HTMLElement | null][]>([]);
  const RookToSquaresRefs = useRef<[HTMLElement | null, HTMLElement | null][]>([]);

  const mouseDownRef = useRef(false);

  useEffect(() => {
    socket.on("move_update", (data) => {
        const notation = data.move;
        const [fromId, toId] = getSquaresData(notation);
        const fromSquare = squareRefs.current[fromId];
        const toSquare = squareRefs.current[toId];

        if (!fromSquare || !toSquare) return;

        const turn = Number(getTurn() === "w");
        const potentialEnPassantCaptureSquare = getEnPassantData(toSquare);

        // @ts-ignore
        const [status, enPassantFlagCheck, shortCastleFlag, longCastleFlag, displayMove] = makeMove(notation, true);
        animateMove(UPDATE, fromSquare, toSquare, enPassantFlagCheck, shortCastleFlag, longCastleFlag, potentialEnPassantCaptureSquare, turn);

    });
  }, []);

  // Mini Functions (Getters)
  const removeAllEnteries = () => {
    document.querySelectorAll(".entered").forEach((el) =>
        el.classList.remove("entered")
    );
  }
  const getSquareId = (move: number) => {
        const from = move & 0x3F;
        const to = (move >> 6) & 0x3F;
        const toReturn = [
            `${(from % 8)+1}${Math.floor(from / 8)+1}`,
            `${(to % 8)+1}${Math.floor(to / 8)+1}`
        ];
        return toReturn;
    }

  const showLegalMoves = (fromSquare: string) => {
        const moves = [];
        const rawData = getLegalMoves();

        for(let i=0; i<rawData.size(); i++) {
            moves.push(getSquareId(rawData.get(i)));
        }

        const squares: HTMLElement[] = [];
        moves.forEach(move => {
           if (fromSquare === move[0]) {
                const square = document.getElementById(move[1]);
                if (!square) return;
                squares.push(square);
                const sqrChildNode = square.childNodes[0] as HTMLElement;
                sqrChildNode.classList.remove("hide");
                sqrChildNode.classList.add("show");

           } 
        });
        legalMoveSquaresRef.current = squares;
    }

    const removeLegalMoves = () => {
        legalMoveSquaresRef.current.forEach(square => {
          const sqrChildNode = square.childNodes[0] as HTMLElement;
            sqrChildNode.classList.remove("show");
            sqrChildNode.classList.add("hide");
        });
        legalMoveSquaresRef.current = [];
    }

  const getEnPassantData = (toSquare: HTMLElement): HTMLElement | null => {
    const turn = getTurn();
    const id = Number(toSquare.id[0])*10 + (turn === "w" ? Number(toSquare.id[1]) - 1 : Number(toSquare.id[1]) + 1)
    const targetSquare = squareRefs.current[String(id)];
    return targetSquare;
  }

  const getAnimatedMoveData = (fromSquare: HTMLElement, toSquare: HTMLElement): [number, number] => {
    const dimensions = fromSquare.getBoundingClientRect().width
    const distanceY = (Number(toSquare.id[1]) - Number(fromSquare.id[1])) * dimensions
    const distanceX = (Number(toSquare.id[0]) - Number(fromSquare.id[0])) * dimensions

    return [distanceX, distanceY]
  }

  // @ts-ignore
  const animateMove = (moveType: number, fromSquare: HTMLElement, toSquare: HTMLElement, enPassantFlagCheck: boolean, shortCastleFlag: boolean, longCastleFlag: boolean, enPassantSquare: HTMLElement | null, turn: number, isUndo=0, piece=null, enPassantPiece=null) => {
        const [distanceX, distanceY] = getAnimatedMoveData(fromSquare, toSquare); 

        
        if (moveType === UPDATE) {
          const fromPiece = fromSquare.childNodes[1] as HTMLElement;
          fromPiece.classList.add("animate-square");
          fromPiece.style.transform = `translate(${flip ? -distanceX : distanceX}px, ${flip ? distanceY : -distanceY}px)`;
          setTimeout(() => {
              if (fromSquare.childNodes.length > 1) fromSquare.removeChild(fromSquare.childNodes[1]);
              if (toSquare.childNodes.length > 1) toSquare.removeChild(toSquare.childNodes[1]);
              if (enPassantFlagCheck && enPassantSquare) enPassantSquare.removeChild(enPassantSquare.childNodes[1]);
              toSquare.appendChild(fromPiece);

              fromPiece.style.transform = "translate(0px, 0px)"
              fromPiece.classList.remove("animate-square")
              selectedPieceRef.current = null;
          }, 201);

        } else {
          const draggedPiece = draggedPieceRef.current;
          const parentDSquare = draggedPiece?.parentNode as HTMLElement;

          const selectedPiece = selectedPieceRef.current;
          const parentSSquare = selectedPiece?.parentNode as HTMLElement;

          if (moveType === DRAG && parentDSquare && draggedPiece) {
              parentDSquare.classList.remove("selected-square");
              if (fromSquare.childNodes.length > 1) fromSquare.removeChild(fromSquare.childNodes[1]);
              if (toSquare.childNodes.length > 1) toSquare.removeChild(toSquare.childNodes[1]);
              if (enPassantFlagCheck && enPassantSquare) enPassantSquare.removeChild(enPassantSquare.childNodes[1]);
              toSquare.appendChild(draggedPiece);
              draggedPiece.style.transform = `translate(0px, 0px)`;
          } else if (moveType === SELECT && selectedPiece) {
              selectedPiece.classList.add("animate-square");
              parentSSquare.classList.remove("selected-square");
              selectedPiece.style.transform = `translate(${flip ? -distanceX : distanceX}px, ${flip ? distanceY : -distanceY}px)`;
              setTimeout(() => {
                  if (fromSquare.childNodes.length > 1) fromSquare.removeChild(fromSquare.childNodes[1]);
                  if (toSquare.childNodes.length > 1) toSquare.removeChild(toSquare.childNodes[1]);
                  if (enPassantFlagCheck && enPassantSquare) enPassantSquare.removeChild(enPassantSquare.childNodes[1]);
                  toSquare.appendChild(selectedPiece);

                  selectedPiece.style.transform = "translate(0px, 0px)"
                  selectedPiece.classList.remove("animate-square")
                  selectedPieceRef.current = null;
              }, 201);
          }
      }

        if (shortCastleFlag) {

            const rookSquare = RookSquaresRefs.current[SHORT][turn];
            const rookToSquare = RookToSquaresRefs.current[SHORT][turn];

            if (!rookSquare || !rookToSquare) return;
            const rookPiece = rookSquare.childNodes[1] as HTMLElement;

            const [distanceX, distanceY] = getAnimatedMoveData(rookSquare, rookToSquare);

            rookPiece.classList.add("animate-square")
            rookPiece.style.transform = `translate(${flip ? -distanceX : distanceX}px, ${flip ? distanceY : -distanceY}px)`;

            setTimeout(() => {
                rookSquare.removeChild(rookSquare.childNodes[1]);
                rookToSquare.appendChild(rookPiece);
                rookPiece.style.transform = "translate(0px, 0px)";
                rookPiece.classList.remove("animate-square");
            }, 201);

        } else if (longCastleFlag) {

            const rookSquare = RookSquaresRefs.current[LONG][turn];
            const rookToSquare = RookToSquaresRefs.current[LONG][turn];

            if (!rookSquare || !rookToSquare) return;
            const rookPiece = rookSquare.childNodes[1] as HTMLElement;

            const [distanceX, distanceY] = getAnimatedMoveData(rookSquare, rookToSquare);

            rookPiece.classList.add("animate-square");
            rookPiece.style.transform = `translate(${flip ? -distanceX : distanceX}px, ${flip ? distanceY : -distanceY}px)`

            setTimeout(() => {
                rookToSquare.removeChild(rookToSquare.childNodes[1]);
                rookSquare.removeChild(rookSquare.childNodes[1]);
                rookToSquare.appendChild(rookPiece)
                rookPiece.style.transform = "translate(0px, 0px)"
                rookPiece.classList.remove("animate-square")
            }, 201);
        }
        

        removeAllEnteries()
  }

  // Handlers
  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    const nativeEvent = event.nativeEvent as PointerEvent & TouchEvent;
    if (event.pointerType === 'touch' && nativeEvent.touches && nativeEvent.touches.length > 1) return;

    const target = event.target as HTMLElement;
    const square = target.classList.contains('base-square') ? target : target.closest('.base-square');
    if (!square) return;

    const piece = target.classList.contains('square') ? target : null;
    document.addEventListener("pointerup", handlePointerUp);

    const result = calculateValuesForPieceMovement(nativeEvent, boardRef, flip);
    if (!result) return;

    const [argI, argJ] = result;
    const squareId = `${argJ}${argI}`;

    if (selectedPieceRef.current && selectedPieceRef.current === piece) {
      handleClickInsideBoard(squareId);
    } else if (piece && piece.id && piece.id[0] === getTurn() && color === getTurn()) {
      event.preventDefault();

      draggedPieceRef.current = piece;
      mouseDownRef.current = true;
      draggedPieceRef.current.classList.add("dragging");
      draggedPieceRef.current.style.cursor = "grabbing";

      document.addEventListener("pointermove", handlePointerMove);

      const target = event.target as HTMLElement;
      if (target.setPointerCapture) {
        target.setPointerCapture(event.pointerId);
      }

      if (selectedPieceRef.current && selectedPieceRef.current !== draggedPieceRef.current) {
        const pNode = selectedPieceRef.current.parentNode as HTMLElement;
        pNode.classList.remove("selected-square");
      }
      selectedPieceRef.current = null;
      removeLegalMoves();

      const parentDSquare = draggedPieceRef.current.parentNode as HTMLElement;
      showLegalMoves(parentDSquare.id);

    } else {
      handleClickInsideBoard(squareId);
    }

  }, []);
  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (!mouseDownRef || !draggedPieceRef.current || !boardRef.current) return;

        event.preventDefault();

        const boardRect = boardRef.current.getBoundingClientRect();
        if (event.clientX < boardRect.left || event.clientX > boardRect.right ||
            event.clientY < boardRect.top || event.clientY > boardRect.bottom) {
        }

        const parentDSquare = draggedPieceRef.current.parentNode as HTMLElement;

        const squareRect = parentDSquare.getBoundingClientRect();
        const pieceRect = draggedPieceRef.current.getBoundingClientRect();
        const dimensions = pieceRect.width;

        draggedPieceRef.current.style.transform = `translate(
            ${event.clientX - squareRect.left - dimensions / 2}px,
            ${event.clientY - squareRect.top - dimensions / 2}px
        )`;

        const result = calculateValuesForPieceMovement(event, boardRef, flip);
        if (!result) return;
        const [argI, argJ] = result;
        const enteredSquareId = `${String(argJ)}${String(argI)}`;

        removeAllEnteries();
        const enteredSquare = document.getElementById(enteredSquareId);
        if (enteredSquare) {
            enteredSquare.classList.add("entered");
        }
  }, []);
  const handlePointerUp = useCallback((event: PointerEvent) => {
    if (!mouseDownRef || !draggedPieceRef.current || !boardRef.current) return;

        if (draggedPieceRef.current.releasePointerCapture) {
            draggedPieceRef.current.releasePointerCapture(event.pointerId);
        }

        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerUp);


        const fromSquare = draggedPieceRef.current.parentNode as HTMLElement;
        const result = calculateValuesForPieceMovement(event, boardRef, flip);

        
        if (!result) {
            console.warn("Dropped piece outside the board?");
            draggedPieceRef.current.style.transform = `translate(0px, 0px)`;
            draggedPieceRef.current.classList.remove("dragging");
            draggedPieceRef.current.style.cursor = "grab";
            removeAllEnteries();
            removeLegalMoves();
            mouseDownRef.current = false;
            draggedPieceRef.current = null;
            return;
        }

        const [argI, argJ] = result;
        const toSquare = document.getElementById(`${String(argJ)}${String(argI)}`);

        if (!toSquare) return;

        const notation = getMoveNotation(fromSquare, toSquare);
        const potentialEnPassantCaptureSquare = getEnPassantData(toSquare);

        draggedPieceRef.current.classList.remove("dragging");
        draggedPieceRef.current.style.cursor = "grab";

        removeLegalMoves();

         if (fromSquare.childNodes.length > 1 && fromSquare.childNodes[1] !== draggedPieceRef.current) {
              console.error("Dragged piece is not the child of its assumed parent square?");
                draggedPieceRef.current.style.transform = `translate(0px, 0px)`;
                //removeAllEnteries();
                mouseDownRef.current = false;
                draggedPieceRef.current = null;
               return;
         }

        const turn = Number(getTurn() === "w");
        // @ts-ignore
        const [status, enPassantFlagCheck, shortCastleFlag, longCastleFlag, displayMove] = makeMove(notation, false);

        if (status) {
            // moveCount++;
            animateMove(DRAG, fromSquare, toSquare, enPassantFlagCheck, shortCastleFlag, longCastleFlag, potentialEnPassantCaptureSquare, turn);
             const {isOver, result, quote} = checkGameOver();
            if (isOver) console.log("Game Over:", quote, "Result:", result);
        } else if (fromSquare === toSquare) {
            handleClickInsideBoard(fromSquare.id);
            
        } else {
            console.log("Invalid move:", notation);
            draggedPieceRef.current.style.transform = `translate(0px, 0px)`;
        }

        // Cleanup drag state regardless of move success
        removeAllEnteries(); // Remove highlight from the square the piece was dropped on
        mouseDownRef.current = false;
        draggedPieceRef.current = null;
  }, []);

  const handleClickInsideBoard = useCallback((targetSquareId: string) => {
    if (draggedPieceRef.current){
        draggedPieceRef.current.style.transform = `translate(0px, 0px)`;
        removeAllEnteries();
        mouseDownRef.current = false;
        draggedPieceRef.current = null
    } 

    const targetSquare = squareRefs.current[targetSquareId];
    if (!targetSquare) return;
    const pieceOnTarget = targetSquare.childNodes.length > 1 ? targetSquare.childNodes[1] as HTMLElement : null;

    if (selectedPieceRef.current && getTurn() === color) {
      const fromSquare = selectedPieceRef.current.parentNode as HTMLElement;
      const notation = getMoveNotation(fromSquare, targetSquare);
      const potentialEnPassantCaptureSquare = getEnPassantData(targetSquare);

      removeLegalMoves();

      const turn = Number(getTurn() === "w");
      // @ts-ignore
      const [status, enPassantFlagCheck, shortCastleFlag, longCastleFlag, displayMove] = makeMove(notation, false);

      if (status) {
          //moveCount++;
          animateMove(SELECT, fromSquare, targetSquare, enPassantFlagCheck, shortCastleFlag, longCastleFlag, potentialEnPassantCaptureSquare, turn);
          fromSquare.classList.remove("selected-square");
          const {isOver, result, quote} = checkGameOver();
          if (isOver) console.log("Game Over:", quote, "Result:", result);

      } else if (fromSquare === targetSquare) {
          fromSquare.classList.remove("selected-square");
          selectedPieceRef.current = null;
      } else {

          console.log("Invalid move:", notation);

            if (pieceOnTarget && pieceOnTarget.id && pieceOnTarget.id[0] === getTurn() && color === getTurn()) {
              console.log(color);
              const parentSSquare = selectedPieceRef.current.parentNode as HTMLElement;
              fromSquare.classList.remove("selected-square");
              selectedPieceRef.current = pieceOnTarget;
              showLegalMoves(parentSSquare.id);
              parentSSquare.classList.add("selected-square");
            } else {
              // Click was on an empty square or wrong-color piece, deselect
              fromSquare.classList.remove("selected-square");
              selectedPieceRef.current = null;
            }
      }

  } else {
      if (pieceOnTarget && pieceOnTarget.id && pieceOnTarget.id[0] === getTurn() && color === getTurn()) {
          selectedPieceRef.current = pieceOnTarget;
          if (!selectedPieceRef.current) return;
          const parentSSquare = selectedPieceRef.current.parentNode as HTMLElement;
          parentSSquare.classList.add("selected-square");
          showLegalMoves(parentSSquare.id);  
      }
    }
  }, [])
  const handleClickOutsideBoard = useCallback((event: MouseEvent | PointerEvent) => {

    if (!boardRef.current) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    const isInsideBoard = mouseX >= boardRect.left && mouseX <= boardRect.right &&
                          mouseY >= boardRect.top && mouseY <= boardRect.bottom;

    // If click is outside the board AND a piece is selected, deselect it
    if (!isInsideBoard && selectedPieceRef.current) {
      const parentSSquare = selectedPieceRef.current.parentNode as HTMLElement;
      parentSSquare.classList.remove("selected-square");
      selectedPieceRef.current = null;
      removeLegalMoves(); // Hide the legal moves of the deselected piece
    }
  }, [])



useEffect(() => {
  const handler = (e: MouseEvent) => {
    if (boardRef.current) {
      handleClickOutsideBoard(e);
    }
  };

  document.addEventListener("click", handler);
  return () => {
    document.removeEventListener("click", handler);
  };
}, [boardRef, handleClickOutsideBoard]);


useEffect(() => {
  RookSquaresRefs.current = [[squareRefs.current["88"], squareRefs.current["81"]], [squareRefs.current["18"], squareRefs.current["11"]]];
  RookToSquaresRefs.current = [[squareRefs.current["68"], squareRefs.current["61"]], [squareRefs.current["48"], squareRefs.current["41"]]];
}, [squareRefs])

  const board = parseFen(fen);
  const finalBoard = flip ? [...board].reverse() : board;

  return (
    <div ref={boardRef} onPointerDown={handlePointerDown} className="board" style={{width: `${size}vmin`, pointerEvents: `${allow ? "all" : "none"}`}} draggable={false} >
      {
      finalBoard.map((row, i) => { 
        const finalRow = flip ? [...row].reverse() : row;
        return ( finalRow.map((square, j) => {
          const argI = flip ? i + 1 : 8 - i;
          const argJ = flip ? 8 - j : j + 1;
          const squareId = `${argJ}${argI}`;
          const isDark = (i % 2) !== (j % 2);

          const pieceData = square ? determinePieceType(square) : null;

          return (
            <div
              key={squareId}
              id={squareId}
              ref={(el) => {(squareRefs.current[squareId] = el);}}
              className={`base-square ${isDark ? "dark" : "light"}`}>
              <div className="move-ind hide"></div>

              {pieceData && (
              <div
                className="square"
                id={pieceData.id}
                style={{backgroundImage: pieceData.img}}
                draggable={false}
              />
            )}
            </div>
          )

        }))})
      }
    </div>
  )
}

const parseFen = (fen: string): (string | null)[][] => {
  const fenPart = fen.split(" ")[0];
  const rows = fenPart.split("/");
  return rows.map(row => {
    const squares: (string | null)[] = [];
    for (const c of row) {
      if ("12345678".includes(c)) {
        for (let i = 0; i < Number(c); i++) squares.push(null);
      } else {
        squares.push(c);
      }
    }
    return squares;
  });
}

const determinePieceType = (square: string): PieceData => {
    switch (square) {
        case "p":
            return { img: pieceImages['b'].pawn, id: "bp" };
        case "b":
            return { img: pieceImages['b'].bishop, id: "bb" };
        case "n":
            return { img: pieceImages['b'].knight, id: "bn" };
        case "r":
            return { img: pieceImages['b'].rook, id: "br" };
        case "q":
            return { img: pieceImages['b'].queen, id: "bq" };
        case "k":
            return { img: pieceImages['b'].king, id: "bk" };

        case "P":
            return { img: pieceImages['w'].pawn, id: "wp" };
        case "B":
            return { img: pieceImages['w'].bishop, id: "wb" };
        case "N":
            return { img: pieceImages['w'].knight, id: "wn" };
        case "R":
            return { img: pieceImages['w'].rook, id: "wr" };
        case "Q":
            return { img: pieceImages['w'].queen, id: "wq" };
        case "K":
            return { img: pieceImages['w'].king, id: "wk" };
        default:
            return {};
    }
}

const calculateValuesForPieceMovement = (
  event: PointerEvent,
  boardRef: React.RefObject<HTMLDivElement | null>,
  boardFlipped: boolean
): [number, number] | null =>  {
  if (!boardRef?.current) return null;

  const { x: boardX, y: boardY, width: boardW } = boardRef.current.getBoundingClientRect();
  const squareSize = boardW / 8;

  const relativeX = event.clientX - boardX;
  const relativeY = event.clientY - boardY;

  if (relativeX < 0 || relativeY < 0 || relativeX > boardW || relativeY > boardW) return null;

  let file = Math.floor(relativeX / squareSize)+1;
  let rank = 8 - Math.floor(relativeY / squareSize);

  if (boardFlipped) {
    file = 9 - file;
    rank = 9 - rank;
  }

  return [rank, file];
}

const getMoveNotation = (fromSquare: HTMLElement, toSquare: HTMLElement): string => {
        return `${letters[Number(fromSquare.id[0]) - 1]}${Number(fromSquare.id[1])}${letters[Number(toSquare.id[0]) - 1]}${Number(toSquare.id[1])}`;
}

const getSquaresData = (notation: string): [string, string] => {
  const from = notation.substr(0, 2);
  const to = notation.substr(2, 4);
  
  return [`${letters.search(from[0])+1}${from[1]}`, `${letters.search(to[0])+1}${to[1]}`];
}


export default Board;