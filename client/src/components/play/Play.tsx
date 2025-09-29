import { useState, useRef, useEffect } from "react";
import NavBar from "../home-components/Nav";
import socket from "@components/Socket";
import GameBox from "./GameBox";

const timeControls = [
    "1+0", "3+0", "3+2",
    "5+0", "5+5", "10+0",
    "10+1", "15+10", "30+0"
]

const timeControlIndex: Record<string, number> = {
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

const Play = () => {

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [boxStates, setBoxStates] = useState<boolean[]>(Array(9).fill(false));
    const timeControlRef = useRef<string>('');


    useEffect(() => {

        socket.on("match_found", (data) => {
            window.location.href = `/game/${data.gameId}/${data.color}`; 
        })
            
        }, []);


    const emitGameRequest = (timeControl: string) => {
        socket.emit("join-queue", {
            timeControl: timeControl,
        });
        timeControlRef.current = timeControl;
        const boxes = new Array(9).fill(false);
        boxes[timeControlIndex[timeControl]] = true;
        setBoxStates(boxes);
    }


    return (
        <>
            <NavBar setIsLoggedInGlobal={setIsLoggedIn} setIsModalOpenGlobal={setIsModalOpen} showModal={isModalOpen}/>
            <div className="modes-container">
                {timeControls.map((mode, idx) => {
                    return (
                        <GameBox timeControl={mode} isLoggedIn={isLoggedIn} isWaiting={boxStates[idx]} openModal={()=>setIsModalOpen(true)} emitRequest={emitGameRequest} key={idx} />
                    )
                    
                })}
                
            </div>
        </>
        
    )

}

export default Play;