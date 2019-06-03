import React, { useState } from 'react';
import Container from './components/Container';
import { gameConfig } from './config/game';

function App() {
    const [game] = useState(new Container(gameConfig));
    game; // TODO
    return (
        <div id='game'/>
    );
}

export default App;
