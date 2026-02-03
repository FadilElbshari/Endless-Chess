import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import "@styles/home.css";
import LoginSignup from "./LoginSignup";
const NavBar = ({ setIsLoggedInGlobal, setIsModalOpenGlobal, showModal }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const res = await fetch('/api/check-session');
                if (!res.ok)
                    throw new Error('Failed to fetch login status');
                const data = await res.json();
                setIsLoggedIn(data.loggedIn);
                if (!setIsLoggedInGlobal)
                    return;
                setIsLoggedInGlobal(data.loggedIn);
            }
            catch (error) {
                console.error("Unable to check current session.");
                setIsLoggedIn(false);
                if (!setIsLoggedInGlobal)
                    return;
                setIsLoggedInGlobal(false);
            }
        };
        checkLoginStatus();
    }, []);
    useEffect(() => {
        if (showModal != true && showModal != false)
            return;
        setIsModalOpen(showModal);
    }, [showModal]);
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
    return (_jsxs(_Fragment, { children: [_jsx("nav", { children: _jsxs("div", { className: "nav-content", children: [_jsx("div", { className: "logo", children: _jsx("a", { onClick: () => window.location.href = "/", children: "Endless Chess" }) }), _jsxs("div", { className: "nav-links", children: [_jsx("a", { onClick: () => window.location.href = "/play", children: "Play" }), isLoggedIn ? (_jsx("a", { onClick: makeLogoutRequest, children: "Logout" })) : (_jsx("a", { id: "trigger-modal", onClick: () => {
                                        setIsModalOpen(true);
                                        if (!setIsModalOpenGlobal)
                                            return;
                                        setIsModalOpenGlobal(true);
                                    }, children: "Login" })), _jsx("a", { href: "#", children: "Watch" }), _jsx("a", { onClick: () => window.location.href = "/about", children: "About" })] })] }) }), _jsx(LoginSignup, { isOpen: isModalOpen, onClose: () => {
                    setIsModalOpen(false);
                    if (!setIsModalOpenGlobal)
                        return;
                    setIsModalOpenGlobal(false);
                } })] }));
};
export default NavBar;
