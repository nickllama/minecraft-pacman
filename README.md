# Minecraft PacMan — Steve vs Zombies

Classic PacMan gameplay reskinned with Minecraft flavor:

- **Steve** replaces PacMan
- **Zombies** replace the ghosts (4 of them, each with different behavior)
- **Carrots** replace the dots
- **Golden Apples** are the power-ups — eat one and Steve can hunt zombies for 8 seconds
- Classic 28x31 PacMan maze with side tunnels

## Controls

- **Desktop:** Arrow keys or WASD
- **Mobile:** On-screen D-pad or swipe anywhere on the maze

## Run locally

Just a static site — no build step.

```bash
cd minecraft-pacman
python3 -m http.server 8000
# open http://localhost:8000
```

## Regenerate textures

```bash
python3 generate_textures.py
```

Textures are 16x16 pixel art scaled up 4x, written to `assets/`.
