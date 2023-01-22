<script lang="ts">
	import { onMount } from 'svelte';
	import { getGameContext$ } from './+page.svelte';
	import { SphereGeometry, Mesh, MeshBasicMaterial } from 'three';

	export let position: Position;
	export let color: Color;

	const game$ = getGameContext$();

	onMount(async () => {
		const root = $game$.scene;

		const geometry = new SphereGeometry(5, 32, 32);
		const material = new MeshBasicMaterial({ color: convertColorStringToHex(color) });
		const sphere = new Mesh(geometry, material);
		sphere.position.set(position.x, position.y, position.z);

		root.add(sphere);

		return () => {
			root.remove(sphere);
		};
	});

	function convertColorStringToHex(color: Color) {
		switch (color) {
			case 'red':
				return 0xff0000;
		}
	}

	type Color = 'red';
</script>
