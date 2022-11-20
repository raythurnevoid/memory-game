<script lang="ts" context="module">
	import { createContext } from '@raythurnevoid/svelte-context-enhanced';
	import {
		LoadingManager,
		PerspectiveCamera,
		Raycaster,
		Scene,
		TextureLoader,
		Vector2,
		WebGLRenderer,
		type Intersection
	} from 'three';
	import type { Readable } from 'svelte/store';

	export const [setGameContext$, getGameContext$] = createContext<Readable<GameContext>>();

	export interface GameContext {
		scene: Scene;
		textureLoader: TextureLoader;
		addTextureLoadListener: (cb: () => void) => Unsubscriber;
		addMeshClickListener: (
			mesh: THREE.Mesh,
			cb: (data: { event: TouchEvent | MouseEvent; intersection: Intersection }) => void
		) => Unsubscriber;
	}

	type Unsubscriber = () => void;
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
	import { derived, writable } from 'svelte/store';
	import Card from './Card.svelte';

	const scene$ = writable<Scene>(undefined);
	const et = new EventTarget();
	let renderer: WebGLRenderer;
	let loadManager: LoadingManager;
	let textureLoader: TextureLoader;
	let camera: PerspectiveCamera;
	let raycaster: Raycaster;
	let pointer: Vector2;

	setGameContext$(
		derived(scene$, ($scene$) => {
			return {
				scene: $scene$,
				textureLoader,
				loadManager,
				addTextureLoadListener: (cb) => {
					et.addEventListener('textureLoad', cb, {
						once: true,
						passive: true
					});

					return () => et.removeEventListener('textureLoad', cb);
				},
				addMeshClickListener: (mesh, cb) => {
					renderer.domElement.addEventListener('click', listener);

					function listener(event: MouseEvent) {
						event.preventDefault();
						raycaster.setFromCamera(pointer, camera);
						const intersections = raycaster.intersectObject(mesh);
						if (intersections.length) {
							const intersection = intersections[0];
							cb({ event, intersection });
						}
					}

					return () => {
						renderer.domElement.removeEventListener('click', listener);
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
		camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
		camera.position.z = 5;

		// controls
		const controls = new OrbitControls(camera, renderer.domElement);
		controls.listenToKeyEvents(window); // optional
		//controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)
		controls.rotateSpeed = 3;
		controls.screenSpacePanning = false;
		controls.minDistance = 1;
		controls.maxDistance = 20;

		raycaster = new Raycaster();
		pointer = new Vector2();
		renderer.domElement.addEventListener(
			'pointermove',
			(event: PointerEvent) => {
				// TODO: to improve, what if canvas is not full screen?
				pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
				pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
			},
			{
				passive: true
			}
		);

		const sceneEl = document.getElementById('scene') as HTMLDivElement;
		sceneEl.appendChild(renderer.domElement);
		$scene$ = new Scene();

		let frameId: number;
		const render = () => {
			controls.update();
			renderer.render($scene$, camera);
			frameId = requestAnimationFrame(render);
		};
		render();

		return () => {
			controls.dispose();
			renderer.dispose();
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
			<Card />
		{/if}
	</div>
</section>

<style>
	#scene {
		user-select: none;
	}
</style>
