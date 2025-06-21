import { useState, useRef, useEffect } from "react";
import NavBar from "./Nav";
import LoginSignup from "./LoginSignup";
import socket from "../Socket";
import { useNavigate } from "react-router-dom";

const Home = () => {

    const navigate = useNavigate();
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
                    <h1>[A good statement]</h1>
                    <p>[Inspirational Sentence]</p>
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