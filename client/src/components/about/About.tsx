import { useState, useEffect } from "react";

import NavBar from "../home-components/Nav";
import LoginSignup from "../home-components/LoginSignup";

const About = () => {

    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [isModalOpen, setModalOpen] = useState(false);


    useEffect(() => {
        const checkLoginStatus = async() => {
            try {
                const response = await fetch('/api/check-session');
                if (!response.ok) throw new Error('Failed to fetch login status');

                const data = await response.json();
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
            <LoginSignup isOpen={isModalOpen} onClose={()=>setModalOpen(false)}/>
        </>
        
    )

}

export default About;