import { useState, useEffect } from "react";
import "@styles/home.css"
import LoginSignup from "./LoginSignup";

interface NavBarProps {
    setIsLoggedInGlobal?: (state: boolean) => void;
    setIsModalOpenGlobal?: (state: boolean) => void;
    showModal?: boolean;
    // isLoggedIn: boolean;
    // logoutReq: () => void;
    // showModal: () => void;
}

const NavBar: React.FC<NavBarProps> = ({setIsLoggedInGlobal, setIsModalOpenGlobal, showModal}) => {

        const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
        const [isModalOpen, setIsModalOpen] = useState(false);

        useEffect(() => {
            const checkLoginStatus = async() => {
                try {
                    const res = await fetch('/api/check-session');
                    if (!res.ok) throw new Error('Failed to fetch login status');

                    const data = await res.json();
                    setIsLoggedIn(data.loggedIn);
                    if (!setIsLoggedInGlobal) return;
                    setIsLoggedInGlobal(data.loggedIn);

                } catch (error) {
                    console.error("Unable to check current session.")
                    setIsLoggedIn(false);
                    if (!setIsLoggedInGlobal) return;
                    setIsLoggedInGlobal(false);
                }
            }

            checkLoginStatus();
                
        }, []);

        useEffect(() => {
            if (showModal != true && showModal != false) return;
            setIsModalOpen(showModal);
        }, [showModal])

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

    return (
        <>
        <nav>
            <div className="nav-content">
                <div className="logo"><a onClick={()=>window.location.href = "/"}>Endless Chess</a></div>
                <div className="nav-links">
                    <a onClick={()=>window.location.href = "/play"}>Play</a>

                    {isLoggedIn ? (
                        <a onClick={makeLogoutRequest}>Logout</a>
                        ) : (
                        <a id="trigger-modal" onClick={()=>{
                            setIsModalOpen(true);
                            if (!setIsModalOpenGlobal) return;
                            setIsModalOpenGlobal(true);
                        }}>Login</a>
                        )}
                    <a href="#">Watch</a>
                    <a onClick={()=>window.location.href = "/about"}>About</a>
                </div>
            </div>
        </nav>
        <LoginSignup isOpen={isModalOpen} onClose={()=>{
            setIsModalOpen(false);
            if (!setIsModalOpenGlobal) return;
            setIsModalOpenGlobal(false);
        }}/>
        </>
    )

}

export default NavBar;