import { useParams } from "react-router-dom";
import NavBar from "./Nav";
import "@styles/profile.css";

const Profile = () => {

    const {username} = useParams();

    return (
        <>
            <NavBar />
            <div className="profile-container">
                <div className="profile-photo">
                    <h1>{username}</h1>
                    <img src="/api/images/placeholder.jpg" alt={username} />
                </div>
                <div className="games-log-container">
                    <h2>hello</h2>
                    <h2>hello</h2>
                    <h2>hello</h2>
                    <h2>hello</h2>
                </div>
            </div>
        </>
    )
}

export default Profile;