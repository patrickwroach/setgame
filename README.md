# Set Game

A browser-based implementation of the card game Set, built with Next.js and React.

## Features

- 12-card board that always contains exactly 4 valid sets
- Interactive card selection
- Visual feedback for valid/invalid sets
- Modern, responsive UI with Tailwind CSS
- Safe versions of Next.js (15.5.7) and React (19.2.1)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## How to Play

- Click on cards to select them (up to 3 at a time)
- A valid set consists of 3 cards where each attribute (number, shape, color, shading) is either all the same or all different
- Find all 4 sets on the board!
- Click "New Game" to generate a new board

## Game Rules

Each card has 4 attributes:
- **Number**: 1, 2, or 3 shapes
- **Shape**: Diamond, Oval, or Squiggle
- **Color**: Red, Green, or Purple
- **Shading**: Solid, Striped, or Empty

A valid set requires that for each of the 4 attributes, the values are either all the same or all different across the 3 cards.
