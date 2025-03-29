# Nautilus Submarine Canyon Game

<img width="935" alt="Screenshot" src="https://github.com/user-attachments/assets/f1fe6f19-d712-4461-b914-7cd71d35cde9" />

Dive into the depths of an underwater canyon in **Nautilus Submarine Canyon Game**, a 3D browser-based game built with Three.js. Pilot the Nautilus, a detailed submarine inspired by Jules Verne's iconic vessel, through a procedurally generated underwater canyon filled with obstacles. Avoid canyon walls and floating rocks as you explore the abyss, with immersive visuals, dynamic lighting, and bubble effects enhancing the experience. How far can you travel before the journey ends?

## Features

- **3D Submarine Model**: Control a meticulously crafted Nautilus submarine with hull details, portholes, fins, and a spinning propeller.
- **Procedural Canyon Generation**: Navigate an ever-changing underwater canyon with randomly generated walls and obstacles.
- **Realistic Environment**: Enjoy a dynamic sea floor, skybox, and bubble particle effects, all rendered with Three.js.
- **Intuitive Controls**: Use arrow keys or WASD to steer, with the spacebar to accelerate forward.
- **Scoring System**: Track your distance traveled, with increasing difficulty as you progress.
- **Game Over & Restart**: Experience an explosive end when you crash, with an option to restart and try again.

## Demo

Try the game live [here](#)

## Dependencies

The game relies on the following external library:
- **[Three.js](https://threejs.org/)**: Loaded via CDN (`v0.158.0`) for 3D rendering. No additional installation is required as it’s included in the HTML.

## File Structure

```
nautilus-submarine-game/
├── index.html    # Main HTML file with game structure
├── styles.css    # CSS for layout and UI styling
├── script.js     # Game logic and Three.js implementation
└── README.md     # This file
```

## How to Play
- **Controls**:
  - `Arrow Keys` or `WASD`: Move the submarine up, down, left, or right.
  - `Spacebar`: Boost forward speed.
- **Objective**: Navigate the submarine through the canyon, avoiding walls and obstacles. The farther you travel, the higher your score!
- **Game Over**: Colliding with a wall or obstacle triggers an explosion, ending the game. Click "Play Again" to restart.

## Development
The game is built using:
- **HTML/CSS**: For the basic structure and styling of the game UI.
- **JavaScript with Three.js**: Handles 3D rendering, physics, and game logic.

To modify or extend the game:
1. Edit `styles.css` for UI and layout changes.
2. Update `script.js` for game mechanics, submarine design, or environment generation.
3. Test changes by refreshing your local server.

### Potential Enhancements
- Add sound effects for immersion (e.g., engine hum, collision sounds).
- Introduce power-ups or collectibles to increase replayability.
- Implement a high-score system with local storage.

## Contributing
Contributions are welcome!

## Credits
Powered by [Three.js](https://threejs.org/) and inspired by classic underwater adventures.

## License
This project is licensed under the [MIT License](LICENSE).
