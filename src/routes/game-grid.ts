export const cardSize: Size = [100, 100];
export const cardsGap: Size = [20, 20];

function getCardWidth() {
	return cardSize[0];
}

function getCardHeight() {
	return cardSize[1];
}

function getGridGapX() {
	return cardsGap[0];
}

function getGridGapY() {
	return cardsGap[1];
}

export function createCardsRowPositions(input: {
	row: number;
	cols: number;
	offsetXRatio?: number;
}) {
	const fixedInput = Object.assign({ offsetXRatio: 0 }, input);

	const cards: Position[] = [];
	const offsetX = getCardWidth() * fixedInput.offsetXRatio;

	for (let col = 0; col < input.cols; col++) {
		cards.push([
			(offsetX || 0) + col * (getCardWidth() + getGridGapX()),
			-(input.row * (getCardHeight() + getGridGapY()))
		]);
	}

	return cards;
}

export type Size = [w: number, h: number];
export type Position = [x: number, y: number];
export type GridAttributes = [cols: number, rows: number, cellW: number, cellY: number];
export type Range = [start: number, end: number];
