import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef } from "react";
// const LOGIN = 1;
// const SIGNUP = 0;
const LoginSignup = ({ isOpen, onClose }) => {
    const loginLinkRef = useRef(null);
    // const signupLinkRef = useRef<HTMLDivElement>(null);
    const [mode, setMode] = useState("login");
    const [error, setError] = useState(null);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const usernameRef = useRef(null);
    const emailRef = useRef(null);
    const passwordRef = useRef(null);
    const clearPwd = () => {
        if (!passwordRef.current)
            return;
        setPassword('');
        passwordRef.current.value = '';
    };
    const isValidUsername = (username) => /^[a-zA-Z0-9_]+$/.test(username) && username.length >= 8;
    const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
    const isValidPassword = (password) => {
        const minLength = 8;
        const hasLowercase = /[a-z]/.test(password);
        const hasUppercase = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSymbol = /[^A-Za-z0-9]/.test(password);
        return (password.length >= minLength &&
            hasLowercase &&
            hasUppercase &&
            hasNumber &&
            hasSymbol);
    };
    const submitRequest = async (event) => {
        setError(null);
        event.preventDefault();
        if (mode === "login") {
            if (!usernameRef.current || !passwordRef.current)
                return;
            if (username === '' || password === '') {
                setError("Missing Fields!");
                clearPwd();
                return;
            }
            if (!isValidUsername(username)) {
                setError("Invalid username, Characters and numbers, 8+ chars");
                clearPwd();
                return;
            }
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Login failed:', errorData.message);
                    setError(errorData.message);
                    clearPwd();
                    return;
                }
                const data = await response.json();
                console.log('Login successful:', data);
                window.location.reload();
            }
            catch (error) {
                console.error('Network or server error:', error);
                clearPwd();
            }
        }
        else if (mode === "signup") {
            if (!usernameRef.current || !passwordRef.current || !emailRef.current)
                return;
            if (username === '' || password === '' || email === '') {
                setError("Missing Fields!");
                clearPwd();
                return;
            }
            if (!isValidEmail(email)) {
                setError("Invalid email format. test@gmail.com");
                clearPwd();
                return;
            }
            if (!isValidUsername(username)) {
                setError("Invalid username, Characters and numbers, 8+ chars");
                clearPwd();
                return;
            }
            if (!isValidPassword(password)) {
                setError("Invalid password, min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol");
                clearPwd();
                return;
            }
            try {
                const response = await fetch('/api/signup', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, email, password }),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Signup failed:', errorData.message);
                    setError(errorData.message);
                    clearPwd();
                    return;
                }
                const data = await response.json();
                console.log('Signup successful:', data);
                window.location.reload();
                // Do something on success, like update state or redirect
            }
            catch (error) {
                console.error('Network or server error:', error);
                clearPwd();
            }
        }
    };
    return (_jsx(_Fragment, { children: _jsx("div", { className: `modal-overlay ${isOpen ? "fade-in" : "hide"}`, id: "modal-overlay", children: _jsx("div", { className: "modal", children: _jsxs("div", { className: "modal-content", children: [_jsx("button", { id: "closing-button", onClick: onClose, children: "x" }), _jsx("div", { className: "login-container", id: "login", ref: loginLinkRef, children: _jsxs("form", { className: "login-form", children: [_jsx("h1", { children: mode === "login" ? "Login" : "Sign Up" }), error && _jsx("div", { className: "error-container", children: error }), mode === "signup" && (_jsxs("div", { className: "input-group", children: [_jsx("label", { htmlFor: "email", children: "Email" }), _jsx("input", { ref: emailRef, type: "email", name: "email", required: true, onChange: (e) => setEmail(e.target.value) })] })), _jsxs("div", { className: "input-group", children: [_jsx("label", { htmlFor: "username", children: "Username" }), _jsx("input", { ref: usernameRef, type: "text", id: "username-login", name: "username", required: true, autoComplete: "username", onChange: (e) => setUsername(e.target.value) })] }), _jsxs("div", { className: "input-group", children: [_jsx("label", { htmlFor: "password", children: "Password" }), _jsx("input", { ref: passwordRef, type: "password", id: "password-login", name: "password", required: true, autoComplete: "current-password", onChange: (e) => setPassword(e.target.value) })] }), _jsx("button", { type: "submit", onClick: (event) => submitRequest(event), children: mode === "login" ? "Login" : "Sign Up" }), _jsx("p", { className: "footer-text", style: { cursor: "pointer" }, children: mode === "login" ? (_jsxs(_Fragment, { children: ["Don't have an account? ", _jsx("a", { onClick: () => setMode("signup"), children: "Sign up" })] })) : (_jsxs(_Fragment, { children: ["Already have an account? ", _jsx("a", { onClick: () => setMode("login"), children: "Login" })] })) })] }) })] }) }) }) }));
};
export default LoginSignup;
