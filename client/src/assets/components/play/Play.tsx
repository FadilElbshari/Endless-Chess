import { useState, useRef, useEffect } from "react";
import NavBar from "@components/home-components/Nav";
import LoginSignup from "@components/home-components/LoginSignup";
import socket from "@components/Socket";
import GameBox from "@components/play/GameBox";

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

    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [isModalOpen, setModalOpen] = useState(false);
    const [boxStates, setBoxStates] = useState<boolean[]>(Array(9).fill(false));
    const timeControlRef = useRef<string>('');


    useEffect(() => {
        const checkLoginStatus = async() => {
            try {
                const res = await fetch('/api/check-session', {
                    method: 'GET',
                    credentials: 'include',
                });
                if (!res.ok) throw new Error('Failed to fetch login status');

                const data = await res.json();
                setIsLoggedIn(data.loggedIn);
                if (data.loggedIn) socket.connect();

            } catch (error) {
                console.error("Unable to check current session.")
                setIsLoggedIn(false);
            }
        }

        checkLoginStatus();

        socket.on("match_found", (data) => {
            window.location.href = `/game/${data.gameId}/${data.color}`; 
        })
            
        }, []);

    const makeLogoutRequest = async(): Promise<boolean> => {
        try {
            const response = await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            });

            if (!response.ok) {
            console.error('Logout failed:', response.statusText);
            return false;
            }

            window.location.reload();
            return true;
        } catch (error) {
            console.error('Logout error:', error);
            return false;
        }
    }

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
            <NavBar isLoggedIn={isLoggedIn} logoutReq={makeLogoutRequest} showModal={()=>setModalOpen(true)} />
            <div className="modes-container">
                {timeControls.map((mode, idx) => {
                    return (
                        <GameBox timeControl={mode} isLoggedIn={isLoggedIn} isWaiting={boxStates[idx]} openModal={()=>setModalOpen(true)} emitRequest={emitGameRequest} key={idx} />
                    )
                    
                })}
                
            </div>
            <LoginSignup isOpen={isModalOpen} onClose={()=>setModalOpen(false)}/>
        </>
        
    )

}

export default Play;