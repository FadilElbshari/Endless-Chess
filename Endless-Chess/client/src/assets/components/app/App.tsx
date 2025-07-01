import { Routes, Route } from 'react-router-dom';
import Game from '@components/game/Game'
import Home from '@components/home-components/Home';
import Play from '@components/play/Play';
import About from '@components/about/About';
import Footer from '@components/home-components/Footer';

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
        </Routes>
      </main>
      <Footer />
    </div>
    
  )
}

export default App
