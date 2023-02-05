<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { getGameContext$ } from './+page.svelte';
	import { SphereGeometry, Mesh, MeshBasicMaterial } from 'three';
	import type { Position } from '$lib/logic/types';

	export let position: Position;
	export let color: Color;

	const game$ = getGameContext$();

	let mesh: Mesh | undefined = undefined;

	onMount(() => {
		const geometry = new SphereGeometry(5, 32, 32);
		const material = new MeshBasicMaterial({ color: convertColorStringToHex(color) });
		mesh = new Mesh(geometry, material);
		mesh.position.set(position.x, position.y, position.z);

		$game$.scene.add(mesh);

		return () => {};
	});

	onDestroy(() => {
		if (mesh) {
			console.log('Sphere destroy');
			$game$.scene.remove(mesh);
		}
	});

	function convertColorStringToHex(color: Color) {
		switch (color) {
			case 'red':
				return 0xff0000;
		}
	}

	type Color = 'red';
</script>
