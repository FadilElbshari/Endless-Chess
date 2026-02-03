import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import NavBar from "./Nav";
// @ts-ignore
import socket from "@components/Socket";
const Home = () => {
    return (_jsxs(_Fragment, { children: [_jsx(NavBar, {}), _jsx("section", { className: "hero", children: _jsxs("div", { className: "hero-content", children: [_jsx("h1", { children: "Into The Oblivion." }), _jsx("p", { children: "Unlock Your Full Potential Limitless" }), _jsxs("div", { className: "cta-buttons", children: [_jsx("a", { href: "#", className: "button primary-button", id: "play-btn", onClick: () => window.location.href = "/play", children: "Play Now" }), _jsx("a", { href: "#", className: "button secondary-button", id: "about-btn", onClick: () => window.location.href = "/about", children: "Learn More" })] })] }) })] }));
};
export default Home;
