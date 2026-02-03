import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route } from 'react-router-dom';
import Game from '../game/Game';
import Home from '../home-components/Home';
import Profile from '../home-components/profile';
import Play from '../play/Play';
import About from '../about/About';
import Footer from '../home-components/Footer';
function App() {
    return (_jsxs("div", { className: "app-wrapper", children: [_jsx("main", { className: "main-content", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Home, {}) }), _jsx(Route, { path: "/home", element: _jsx(Home, {}) }), _jsx(Route, { path: "/play", element: _jsx(Play, {}) }), _jsx(Route, { path: "/about", element: _jsx(About, {}) }), _jsx(Route, { path: "/game/:gameId/:color", element: _jsx(Game, {}) }), _jsx(Route, { path: "/profile/:username", element: _jsx(Profile, {}) })] }) }), _jsx(Footer, {})] }));
}
export default App;
