<script lang="ts">
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import { getGameContext$ } from './+page.svelte';
	import { PlaneGeometry, Mesh, MeshBasicMaterial, DoubleSide } from 'three';
	import type { ClickEvent } from '$lib/logic/pointerHandler';

	export let position: Position;
	export let color: Color;

	const dispatch = createEventDispatcher<{
		click: ClickEvent;
	}>();

	const game$ = getGameContext$();

	let mesh: Mesh | undefined = undefined;

	onMount(() => {
		const geometry = new PlaneGeometry(500, 500, 8, 8);
		const material = new MeshBasicMaterial({
			color: convertColorStringToHex(color),
			side: DoubleSide,
			transparent: true
		});
		material.opacity = 0.3;
		mesh = new Mesh(geometry, material);
		mesh.position.set(position.x, position.y, position.z);

		$game$.scene.add(mesh);

		$game$.addMeshClickListener(mesh, (event) => {
			dispatch('click', event);
		});
	});

	onDestroy(() => {
		if (mesh) {
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
