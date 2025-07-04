import { useState, useEffect } from "react";
import NavBar from "@components/home-components/Nav";
import LoginSignup from "@components/home-components/LoginSignup";
// @ts-ignore
import socket from "@components/Socket";


const Home = () => {

    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [isModalOpen, setModalOpen] = useState(false);


    useEffect(() => {
        const checkLoginStatus = async() => {
            try {
                const res = await fetch('/api/check-session');
                if (!res.ok) throw new Error('Failed to fetch login status');

                const data = await res.json();
                setIsLoggedIn(data.loggedIn);

            } catch (error) {
                console.error("Unable to check current session.")
                setIsLoggedIn(false);
            }
        }

        checkLoginStatus();
            
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


    return (
        <>
            <NavBar isLoggedIn={isLoggedIn} logoutReq={makeLogoutRequest} showModal={()=>setModalOpen(true)} />
            <section className="hero">
                <div className="hero-content">
                    <h1>Into The Oblivion.</h1>
                    <p>Unlock Your Full Potential Limitless</p>
                    <div className="cta-buttons">
                        <a href="#" className="button primary-button" id="play-btn" onClick={()=>window.location.href = "/play"}>Play Now</a>
                        <a href="#" className="button secondary-button" id="about-btn" onClick={()=>window.location.href = "/about"}>Learn More</a>
                    </div>
                </div>
            </section>
            <LoginSignup isOpen={isModalOpen} onClose={()=>setModalOpen(false)}/>
        </>
        
    )

}

export default Home;