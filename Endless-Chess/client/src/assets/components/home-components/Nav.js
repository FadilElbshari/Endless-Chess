import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "@styles/home.css";
const NavBar = ({ isLoggedIn, logoutReq, showModal }) => {
    return (_jsx("nav", { children: _jsxs("div", { className: "nav-content", children: [_jsx("div", { className: "logo", children: _jsx("a", { onClick: () => window.location.href = "/", children: "Endless Chess" }) }), _jsxs("div", { className: "nav-links", children: [_jsx("a", { onClick: () => window.location.href = "/play", children: "Play" }), isLoggedIn ? (_jsx("a", { onClick: logoutReq, children: "Logout" })) : (_jsx("a", { id: "trigger-modal", onClick: showModal, children: "Login" })), _jsx("a", { href: "#", children: "Watch" }), _jsx("a", { onClick: () => window.location.href = "/about", children: "About" })] })] }) }));
};
export default NavBar;
