<script lang="ts">
	import Confetti from './Confetti.svelte';
	import Plane from './Plane.svelte';

	let confettis: Position[] = [];
	let key = {};

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

<Plane
	position={{
		x: 0,
		y: 0,
		z: 100
	}}
	color="red"
	on:click={handleClick}
/>

{#each confettis as confetti (confetti)}
	<Confetti origin={confetti} on:end={() => handleConfettiEnd(confetti)} />
{/each}
