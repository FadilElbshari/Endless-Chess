import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useParams } from "react-router-dom";
import NavBar from "./Nav";
import "@styles/profile.css";
const Profile = () => {
    const { username } = useParams();
    return (_jsxs(_Fragment, { children: [_jsx(NavBar, {}), _jsxs("div", { className: "profile-container", children: [_jsxs("div", { className: "profile-photo", children: [_jsx("h1", { children: username }), _jsx("img", { src: "/api/images/placeholder.jpg", alt: username })] }), _jsxs("div", { className: "games-log-container", children: [_jsx("h2", { children: "hello" }), _jsx("h2", { children: "hello" }), _jsx("h2", { children: "hello" }), _jsx("h2", { children: "hello" })] })] })] }));
};
export default Profile;
