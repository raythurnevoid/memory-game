<script lang="ts" context="module">
	import { createContext } from '@raythurnevoid/svelte-context-enhanced';
	import {
		LoadingManager,
		type Mesh,
		Raycaster,
		Scene,
		TextureLoader,
		Vector2,
		WebGLRenderer,
		type Intersection
	} from 'three';

	export const [setGameContext$, getGameContext$] = createContext<Readable<GameContext>>();

	export const gameBoardZ = 5;

	export interface GameContext {
		scene: Scene;
		camera: Camera;
		textureLoader: TextureLoader;
		addTextureLoadListener: (cb: () => void) => Unsubscriber;
		addMeshClickListener: (mesh: Mesh, cb: ClickListener) => Unsubscriber;
	}

	type ClickListener = (data: {
		event: TouchEvent | MouseEvent;
		intersection: Intersection;
	}) => void;

	type Unsubscriber = () => void;
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { derived, writable, type Readable } from 'svelte/store';
	import Card from './Card.svelte';
	import { createCardsRowPositions } from './game-grid';
	import { createCamera, type Camera } from './camera';
	import { createControls, type Controls } from './controls';
	import ConfettiGun from './ConfettiGun.svelte';

	const scene$ = writable<Scene>(undefined);
	const camera$ = createCamera({ type: 'perspective' });
	const et = new EventTarget();
	let controls$: Readable<Controls>;
	let renderer: WebGLRenderer;
	let loadManager: LoadingManager;
	let textureLoader: TextureLoader;
	let raycaster: Raycaster;
	let pointer: Vector2;
	let clickListeners: [Mesh, ClickListener][] = [];

	setGameContext$(
		derived([scene$, camera$], ([$scene$, $camera$]) => {
			return {
				scene: $scene$,
				camera: $camera$,
				textureLoader,
				loadManager,
				addTextureLoadListener: (listener) => {
					et.addEventListener('textureLoad', listener, {
						once: true,
						passive: true
					});

					return () => et.removeEventListener('textureLoad', listener);
				},
				addMeshClickListener: (mesh, listener) => {
					clickListeners.push([mesh, listener]);

					return () => {
						const listenerToRemove = listener;
						const meshToRemove = mesh;
						clickListeners = clickListeners.filter(
							([mesh]) => mesh !== meshToRemove && listener !== listenerToRemove
						);
					};
				}
			} as GameContext;
		})
	);

	onMount(() => {
		const sceneEl = document.getElementById('scene') as HTMLDivElement;

		renderer = new WebGLRenderer();
		renderer.setSize(window.innerWidth, window.innerHeight);

		loadManager = new LoadingManager();
		loadManager.onLoad = () => et.dispatchEvent(new CustomEvent('textureLoad'));
		textureLoader = new TextureLoader(loadManager);

		controls$ = createControls({ renderer, camera$, enabled: true });

		const destroyRaycaster = initRaycaster();

		sceneEl.appendChild(renderer.domElement);
		$scene$ = new Scene();

		let frameId: number;
		const render = () => {
			// $controls$.instance?.update();
			renderer.render($scene$, $camera$.instance);
			frameId = requestAnimationFrame(render);
		};
		render();

		return () => {
			$camera$.destroy();
			$controls$?.destroy();
			// destroyRaycaster();
			renderer.dispose();
			cancelAnimationFrame(frameId);
		};
	});

	function initRaycaster() {
		raycaster = new Raycaster();
		pointer = new Vector2();
		renderer.domElement.addEventListener('pointermove', handlePointerMove, {
			passive: true
		});
		renderer.domElement.addEventListener('click', handleClick);

		function handlePointerMove(event: PointerEvent) {
			// TODO: to improve, what if canvas is not full screen?
			pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
			pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
		}

		function handleClick(event: MouseEvent) {
			event.preventDefault();
			raycaster.setFromCamera(pointer, $camera$.instance);
			const meshesListening = Array.from(new Set(clickListeners.map(([mesh]) => mesh)));
			const intersections = raycaster.intersectObjects(meshesListening);
			if (intersections.length) {
				const intersection = intersections[0];
				const listenersToCall = clickListeners
					.filter(([mesh]) => mesh === intersection.object)
					.map(([, listener]) => listener);
				listenersToCall.forEach((listener) => listener({ event, intersection }));
			}
		}

		return () => {
			renderer.domElement.removeEventListener('pointermove', handlePointerMove);
			renderer.domElement.removeEventListener('click', handleClick);
		};
	}
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
