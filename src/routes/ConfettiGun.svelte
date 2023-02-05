<script lang="ts">
	import { getGameGridSize, getGameGridZ } from '$lib/logic/game-grid';
	import type { Position, Size } from '$lib/logic/types';
	import Confetti from './Confetti.svelte';
	import Plane from './Plane.svelte';

	let confettis: Position[] = [];

	const gameGridSize = getGameGridSize();

	const position: Position = {
		x: gameGridSize.w * 0.5,
		y: -gameGridSize.h * 0.5,
		z: getGameGridZ()
	};

	const size: Size = {
		w: gameGridSize.w,
		h: gameGridSize.h
	};

	function handleClick(event: Plane['$$events_def']['click']) {
		confettis = [
			...confettis,
			{
				x: event.detail.intersection.point.x,
				y: event.detail.intersection.point.y,
				z: event.detail.intersection.point.z
			}
		];
	}

	function handleConfettiEnd(confetti: Position) {
		confettis = confettis.filter((i) => i !== confetti);

		console.log(confettis);
	}
</script>

<Plane {position} {size} color="red" on:click={handleClick} />

{#each confettis as confetti (confetti)}
	<Confetti origin={confetti} on:end={() => handleConfettiEnd(confetti)} />
{/each}
