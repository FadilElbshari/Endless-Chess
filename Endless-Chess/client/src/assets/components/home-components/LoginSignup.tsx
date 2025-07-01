import { useState, useRef } from "react";


interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// const LOGIN = 1;
// const SIGNUP = 0;

const LoginSignup: React.FC<ModalProps> = ({isOpen, onClose}) => {
    const loginLinkRef = useRef<HTMLDivElement>(null);
    // const signupLinkRef = useRef<HTMLDivElement>(null);

    const [mode, setMode] = useState<"login" | "signup">("login");
    const [error, setError] = useState<string | null>(null);

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const usernameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    const clearPwd = () => {
        if (!passwordRef.current) return;
        setPassword('');
        passwordRef.current.value = '';
    }
    const isValidUsername = (username: string) => /^[a-zA-Z0-9_]+$/.test(username) && username.length >= 8;
    const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);
    const isValidPassword = (password: string): boolean => {
        const minLength = 8;
        const hasLowercase = /[a-z]/.test(password);
        const hasUppercase = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSymbol = /[^A-Za-z0-9]/.test(password);

        return (
            password.length >= minLength &&
            hasLowercase &&
            hasUppercase &&
            hasNumber &&
            hasSymbol
        );
        }
   
    const submitRequest = async (event: any) => {
        setError(null);
        event.preventDefault();



        if (mode === "login") {
            if (!usernameRef.current || !passwordRef.current) return;

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
                window.location.reload()

            } catch (error) {
                console.error('Network or server error:', error);
                clearPwd();
            }


        } else if (mode === "signup") {
            if (!usernameRef.current || !passwordRef.current || !emailRef.current) return;

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
                window.location.reload()
                // Do something on success, like update state or redirect

            } catch (error) {
                console.error('Network or server error:', error);
                clearPwd();
            }


        }
        
    }

    return (
        <>
            <div className={`modal-overlay ${isOpen ? "fade-in" : "hide"}`} id="modal-overlay">
                <div className="modal">
                    <div className="modal-content">
                        <button id="closing-button" onClick={onClose}>x</button>
                        
                        <div className="login-container" id="login" ref={loginLinkRef}>
                            <form className="login-form">
                                <h1>{mode === "login" ? "Login" : "Sign Up"}</h1>
                                {error && <div className="error-container">{error}</div>}

                                {mode === "signup" && (
                                    <div className="input-group">
                                    <label htmlFor="email">Email</label>
                                    <input ref={emailRef} type="email" name="email" required onChange={(e) => setEmail(e.target.value)} />
                                    </div>
                                )}

                                <div className="input-group">
                                    <label htmlFor="username">Username</label>
                                    <input ref={usernameRef} type="text" id="username-login" name="username" required autoComplete="username" onChange={(e) => setUsername(e.target.value)} />
                                </div>

                                <div className="input-group">
                                    <label htmlFor="password">Password</label>
                                    <input ref={passwordRef} type="password" id="password-login" name="password" required autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} />
                                </div>

                                <button type="submit" onClick={(event)=>submitRequest(event)}>{mode === "login" ? "Login" : "Sign Up"}</button>

                                <p className="footer-text" style={{cursor: "pointer"}}>
                                    {mode === "login" ? (
                                    <>Don't have an account? <a onClick={() => setMode("signup")}>Sign up</a></>
                                    ) : (
                                    <>Already have an account? <a onClick={() => setMode("login")}>Login</a></>
                                    )}
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )

}



export default LoginSignup;