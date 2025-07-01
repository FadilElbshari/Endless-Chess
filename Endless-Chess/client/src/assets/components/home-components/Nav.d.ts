import "@styles/home.css";
interface NavBarProps {
    isLoggedIn: boolean;
    logoutReq: () => void;
    showModal: () => void;
}
declare const NavBar: React.FC<NavBarProps>;
export default NavBar;
