<script lang="ts" context="module">
	import { createContext } from '@raythurnevoid/svelte-context-enhanced';
	import {
		LoadingManager,
		type Mesh,
		OrthographicCamera,
		Raycaster,
		Scene,
		TextureLoader,
		Vector2,
		WebGLRenderer,
		type Intersection
	} from 'three';
	import type { Readable } from 'svelte/store';

	export const [setGameContext$, getGameContext$] = createContext<Readable<GameContext>>();

	export const gameBoardZ = 5;

	export interface GameContext {
		scene: Scene;
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
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
	import { derived, writable } from 'svelte/store';
	import Card from './Card.svelte';
	import { createCardsRowPositions } from './game-grid';

	const scene$ = writable<Scene>(undefined);
	const et = new EventTarget();
	let controls: OrbitControls | null = null;
	let renderer: WebGLRenderer;
	let loadManager: LoadingManager;
	let textureLoader: TextureLoader;
	let camera: OrthographicCamera;
	let raycaster: Raycaster;
	let pointer: Vector2;
	let clickListeners: [Mesh, ClickListener][] = [];

	setGameContext$(
		derived(scene$, ($scene$) => {
			return {
				scene: $scene$,
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
		renderer = new WebGLRenderer();
		renderer.setSize(window.innerWidth, window.innerHeight);

		loadManager = new LoadingManager();
		loadManager.onLoad = () => et.dispatchEvent(new CustomEvent('textureLoad'));
		textureLoader = new TextureLoader(loadManager);

		// TODO: to improve, what if canvas is not full screen?
		const aspectRaio = 16 / 9;
		const viewSize = 5;
		camera = new OrthographicCamera(
			aspectRaio * -viewSize,
			aspectRaio * viewSize,
			viewSize,
			-viewSize,
			0.1,
			10
		);
		camera.position.set(1.8, -3, 10);

		// controls
		if (controls !== null) {
			controls = new OrbitControls(camera, renderer.domElement);
			controls.listenToKeyEvents(window); // optional
			controls.rotateSpeed = 3;
			controls.screenSpacePanning = false;
			controls.minDistance = 1;
			controls.maxDistance = 20;
		}

		const destroyRaycaster = initRaycaster();

		const sceneEl = document.getElementById('scene') as HTMLDivElement;
		sceneEl.appendChild(renderer.domElement);
		$scene$ = new Scene();

		let frameId: number;
		const render = () => {
			controls?.update();
			renderer.render($scene$, camera);
			frameId = requestAnimationFrame(render);
		};
		render();

		return () => {
			destroyRaycaster();
			controls?.dispose();
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
			raycaster.setFromCamera(pointer, camera);
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
		{/if}
	</div>
</section>

<style>
	#scene {
		user-select: none;
	}
</style>
