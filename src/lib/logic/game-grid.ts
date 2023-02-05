const cardsGap: number = 20;
const maxCols: number = 4;
const cardSize: Size = {
	w: 100,
	h: 100
};
const gameGridZ: number = 5;
let gameGrid: Position[][];
let gameGridSize: Size;

function getCardWidth() {
	return getCardSize().w;
}

function getCardHeight() {
	return getCardSize().h;
}

export function getCardSize() {
	return cardSize;
}

export function getGameGridZ() {
	return gameGridZ;
}

function getGridGap() {
	return cardsGap;
}

function getGameGridWidth() {
	const maxCols = getGameGrid().reduce((maxCols, row) => Math.max(maxCols, row.length), 0);
	console.log(maxCols * (getCardWidth() + getGridGap()) - getGridGap());
	return maxCols * (getCardWidth() + getGridGap()) - getGridGap();
}

function getGameGridHeight() {
	return getGameGrid().length * (getCardHeight() + getGridGap()) - getGridGap();
}

export function getGameGridSize() {
	if (!gameGridSize) {
		gameGridSize = {
			w: getGameGridWidth(),
			h: getGameGridHeight()
		};
	}
	return gameGridSize;
}

export function getGameGrid() {
	if (!gameGrid) {
		gameGrid = createCardsGridPositions({
			rows: [{ cols: 3 }, { cols: 4 }, { cols: 4 }, { cols: 3 }]
		});
	}
	return gameGrid;
}

function createCardPosition(params: { row: number; col: number; xOffset?: number }) {
	const computedParams = Object.assign({ xOffset: 0 }, params);

	let position: Position | undefined = undefined;

	position = {
		x:
			(computedParams.xOffset || 0) +
			computedParams.col * (getCardWidth() + getGridGap()) +
			getCardWidth() * 0.5,
		y: -(computedParams.row * (getCardHeight() + getGridGap())) - getCardHeight() * 0.5
	};

	console.log(position);

	return position;
}

function createCardsRowPositions(params: { row: number; cols: number }) {
	const gap = getGridGap();
	const cardWidth = getCardWidth();
	const xOffset = (maxCols - params.cols) * (cardWidth + gap) * 0.5;

	const cards: Position[] = [];
	for (let col = 0; col < params.cols; col++) {
		cards.push(createCardPosition({ row: params.row, col, xOffset }));
	}

	return cards;
}

export function createCardsGridPositions(params: { rows: { cols: number }[] }) {
	const grid: Position[][] = [];
	for (let row = 0; row < params.rows.length; row++) {
		grid.push(createCardsRowPositions({ row, cols: params.rows[row].cols }));
	}

	return grid;
}

export interface Size {
	w: number;
	h: number;
}

export interface Position {
	x: number;
	y: number;
}
