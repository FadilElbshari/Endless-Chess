import { Routes, Route } from 'react-router-dom';
import Game from '../game/Game'
import Home from '../home-components/Home';
import Profile from '../home-components/profile';
import Play from '../play/Play';
import About from '../about/About';
import Footer from '../home-components/Footer';

function App() {

  return (
    
    <div className="app-wrapper">
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/play" element={<Play />} />
          <Route path="/about" element={<About />} />
          <Route path="/game/:gameId/:color" element={<Game  />} />
          <Route path="/profile/:username" element={<Profile  />} />
        </Routes>
      </main>
      <Footer />
    </div>
    
  )
}

export default App
