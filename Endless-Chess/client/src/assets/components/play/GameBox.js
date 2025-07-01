import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import "@styles/play.css";
// @ts-ignore
const timeControlMap = {
    "1+0": { start: 60, inc: 0 },
    "3+0": { start: 180, inc: 0 },
    "3+2": { start: 180, inc: 2 },
    "5+0": { start: 300, inc: 0 },
    "5+5": { start: 300, inc: 5 },
    "10+0": { start: 600, inc: 0 },
    "10+1": { start: 600, inc: 1 },
    "15+10": { start: 900, inc: 10 },
    "30+0": { start: 1800, inc: 0 },
};
const GameBox = ({ timeControl, isLoggedIn, isWaiting, openModal, emitRequest }) => {
    const handleClick = () => {
        if (!isLoggedIn) {
            openModal();
            return;
        }
        console.log(timeControl);
        emitRequest(timeControl);
    };
    return (_jsx(_Fragment, { children: _jsx("div", { className: `game-box${isWaiting ? " waiting" : ""}`, onClick: handleClick, children: timeControl }) }));
};
export default GameBox;
