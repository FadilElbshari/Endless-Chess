import "@styles/home.css";
interface NavBarProps {
    setIsLoggedInGlobal?: (state: boolean) => void;
    setIsModalOpenGlobal?: (state: boolean) => void;
    showModal?: boolean;
}
declare const NavBar: React.FC<NavBarProps>;
export default NavBar;
