import NavBar from "./Nav"
// @ts-ignore
import socket from "@components/Socket";


const Home = () => {

    return (
        <>
            <NavBar />
            <section className="hero">
                <div className="hero-content">
                    <h1>Into The Oblivion.</h1>
                    <p>Unlock Your Full Potential Limitless</p>
                    <div className="cta-buttons">
                        <a href="#" className="button primary-button" id="play-btn" onClick={()=>window.location.href = "/play"}>Play Now</a>
                        <a href="#" className="button secondary-button" id="about-btn" onClick={()=>window.location.href = "/about"}>Learn More</a>
                    </div>
                </div>
            </section>
            
        </>
        
    )

}

export default Home;