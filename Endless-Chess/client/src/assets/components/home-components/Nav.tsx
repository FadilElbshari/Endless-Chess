import "@styles/home.css"

interface NavBarProps {
    isLoggedIn: boolean;
    logoutReq: () => void;
    showModal: () => void;
}

const NavBar: React.FC<NavBarProps> = ({isLoggedIn, logoutReq, showModal}) => {

    return (
        <nav>
            <div className="nav-content">
                <div className="logo"><a onClick={()=>window.location.href = "/"}>Endless Chess</a></div>
                <div className="nav-links">
                    <a onClick={()=>window.location.href = "/play"}>Play</a>

                    {isLoggedIn ? (
                        <a onClick={logoutReq}>Logout</a>
                        ) : (
                        <a id="trigger-modal" onClick={showModal}>Login</a>
                        )}
                    <a href="#">Watch</a>
                    <a onClick={()=>window.location.href = "/about"}>About</a>
                </div>
            </div>
        </nav>
    )

}

export default NavBar;