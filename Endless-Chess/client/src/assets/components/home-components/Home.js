import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import NavBar from "@components/home-components/Nav";
import LoginSignup from "@components/home-components/LoginSignup";
// @ts-ignore
import socket from "@components/Socket";
const Home = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isModalOpen, setModalOpen] = useState(false);
    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const res = await fetch('/api/check-session');
                if (!res.ok)
                    throw new Error('Failed to fetch login status');
                const data = await res.json();
                setIsLoggedIn(data.loggedIn);
            }
            catch (error) {
                console.error("Unable to check current session.");
                setIsLoggedIn(false);
            }
        };
        checkLoginStatus();
    }, []);
    const makeLogoutRequest = async () => {
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
        }
        catch (error) {
            console.error('Logout error:', error);
            return false;
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx(NavBar, { isLoggedIn: isLoggedIn, logoutReq: makeLogoutRequest, showModal: () => setModalOpen(true) }), _jsx("section", { className: "hero", children: _jsxs("div", { className: "hero-content", children: [_jsx("h1", { children: "Into The Oblivion." }), _jsx("p", { children: "Unlock Your Full Potential Limitless" }), _jsxs("div", { className: "cta-buttons", children: [_jsx("a", { href: "#", className: "button primary-button", id: "play-btn", onClick: () => window.location.href = "/play", children: "Play Now" }), _jsx("a", { href: "#", className: "button secondary-button", id: "about-btn", onClick: () => window.location.href = "/about", children: "Learn More" })] })] }) }), _jsx(LoginSignup, { isOpen: isModalOpen, onClose: () => setModalOpen(false) })] }));
};
export default Home;
