import "@styles/play.css";
interface GameBoxProps {
    timeControl: string;
    isLoggedIn: boolean;
    isWaiting: boolean;
    openModal: () => void;
    emitRequest: (timeControl: string) => void;
}
declare const GameBox: React.FC<GameBoxProps>;
export default GameBox;
