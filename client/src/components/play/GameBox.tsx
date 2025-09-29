import "@styles/play.css"


interface GameBoxProps {
    timeControl: string;
    isLoggedIn: boolean;
    isWaiting: boolean;
    openModal: ()=>void;
    emitRequest: (timeControl: string)=>void
}

type timeControlType = {start: number, inc: number};

// @ts-ignore
const timeControlMap: Record<string, timeControlType> = {
    "1+0" :     {start: 60,     inc: 0},
    "3+0" :     {start: 180,    inc: 0},
    "3+2" :     {start: 180,    inc: 2},
    "5+0" :     {start: 300,    inc: 0},
    "5+5" :     {start: 300,    inc: 5},
    "10+0" :    {start: 600,    inc: 0},
    "10+1" :    {start: 600,    inc: 1},
    "15+10" :   {start: 900,    inc: 10},
    "30+0" :    {start: 1800,   inc: 0},

};

const GameBox: React.FC<GameBoxProps> = ({timeControl, isLoggedIn, isWaiting, openModal, emitRequest}) => {

    const handleClick = () => {
        if (!isLoggedIn){ openModal(); return; }
        console.log(timeControl);

        emitRequest(timeControl);

    }

    return (
        <>
        <div className={`game-box${isWaiting ? " waiting" : ""}`} onClick={handleClick}>
            {timeControl}
        </div>
        </>
        
    )

}

export default GameBox;