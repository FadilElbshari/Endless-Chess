import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route } from 'react-router-dom';
import Game from '@components/game/Game';
import Home from '@components/home-components/Home';
import Play from '@components/play/Play';
import About from '@components/about/About';
import Footer from '@components/home-components/Footer';
function App() {
    return (_jsxs("div", { className: "app-wrapper", children: [_jsx("main", { className: "main-content", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Home, {}) }), _jsx(Route, { path: "/home", element: _jsx(Home, {}) }), _jsx(Route, { path: "/play", element: _jsx(Play, {}) }), _jsx(Route, { path: "/about", element: _jsx(About, {}) }), _jsx(Route, { path: "/game/:gameId/:color", element: _jsx(Game, {}) })] }) }), _jsx(Footer, {})] }));
}
export default App;
