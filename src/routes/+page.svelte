<script lang="ts" context="module">
	import { createContext } from '@raythurnevoid/svelte-context-enhanced';
	import { LoadingManager, type Mesh, Scene, Camera } from 'three';
	import { createTextureLoader$, type TextureLoader } from '$lib/logic/textureLoader';

	export const [setGameContext$, getGameContext$] = createContext<Readable<GameContext>>();

	export const gameBoardZ = 5;

	export interface GameContext {
		scene: Scene;
		camera: Camera;
		textureLoader: TextureLoader;
		addMeshClickListener: (mesh: Mesh, listener: ClickListener) => Unsubscriber;
	}

	type Unsubscriber = () => void;
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { derived, writable, type Readable } from 'svelte/store';
	import Card from './Card.svelte';
	import { createCardsRowPositions } from './game-grid';
	import ConfettiGun from './ConfettiGun.svelte';
	import { createRenderer$ } from '$lib/logic/renderer';
	import { createCamera$ } from '$lib/logic/camera';
	import { createControls$ } from '$lib/logic/controls';
	import { createPointerHandler$, type ClickListener } from '$lib/logic/pointerHandler';

	const renderer$ = createRenderer$();
	const scene$ = writable<Scene>(undefined);
	const camera$ = createCamera$({ type: 'perspective' });
	const pointerHandler$ = createPointerHandler$({
		renderer$,
		camera$
	});
	const controls$ = createControls$({
		renderer$,
		camera$,
		enabled: false
	});
	const textureLoader$ = createTextureLoader$();

	const game$ = setGameContext$(
		derived([scene$, camera$], ([$scene$, $camera$]) => {
			return {
				scene: $scene$,
				camera: $camera$,
				textureLoader: $textureLoader$,
				addMeshClickListener: (mesh, listener) => {
					return $pointerHandler$?.addMeshClickListener(mesh, listener);
				}
			} as GameContext;
		})
	);

	onMount(() => {
		console.log('Game onMound', game$, $game$);
		const sceneEl = document.getElementById('scene') as HTMLDivElement;

		sceneEl.appendChild($renderer$!.domElement);
		$scene$ = new Scene();

		let frameId: number;
		const render = () => {
			$renderer$!.render($scene$, $camera$!);
			frameId = requestAnimationFrame(render);
		};
		render();

		return () => {
			camera$.destroy();
			controls$.destroy();
			pointerHandler$.destroy();
			renderer$.destroy();
			cancelAnimationFrame(frameId);
		};
	});
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
	<div id="scene">
		{#if $scene$}
			{#each createCardsRowPositions({ row: 1, cols: 3, offsetXRatio: 0.5 }) as position}
				<Card {position} />
			{/each}
			{#each createCardsRowPositions({ row: 2, cols: 4 }) as position}
				<Card {position} />
			{/each}
			{#each createCardsRowPositions({ row: 3, cols: 4 }) as position}
				<Card {position} />
			{/each}
			{#each createCardsRowPositions({ row: 4, cols: 3, offsetXRatio: 0.5 }) as position}
				<Card {position} />
			{/each}

			<ConfettiGun />
		{/if}
	</div>
</section>

<style>
	#scene {
		user-select: none;
	}
</style>
