import { browser } from '$app/environment';
import { derived, writable, type Readable, get } from 'svelte/store';
import type { Camera, Euler, Vector3, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import type { Camera$ } from './camera';
import type { Renderer$ } from './renderer';

export function createControls$(input: CreateControls$Input) {
	let initialized = false;
	let destroyed = false;

	const { renderer$, camera$, enabled } = input;
	const enabled$ = writable(enabled);

	let initialCameraValues: InitialCameraValues | undefined = undefined;

	const controls$ = derived(
		[renderer$, camera$, enabled$],
		([renderer, camera, enabled]) => {
			if (!browser || destroyed) return undefined;
			clean();
			if (!renderer || !camera) return undefined;

			initialCameraValues ??= getInitialCameraValues(camera);

			let controls: OrbitControls | null = null;
			if (enabled) {
				controls = createControls(renderer, camera, initialCameraValues);
			} else {
				controls = null;
			}

			if (!initialized) {
				window.addEventListener('keyup', handleKeyPress);
			}

			initialized = true;
			return controls;
		},
		undefined
	);

	let unsubscribe: (() => void) | undefined = undefined;
	if (browser) {
		unsubscribe = controls$.subscribe(() => {});
	}

	return {
		...controls$,
		destroy
	};

	function createControls(
		renderer: WebGLRenderer,
		camera: Camera,
		initialCameraValues: InitialCameraValues
	) {
		const controls = new OrbitControls(camera, renderer.domElement);
		controls.listenToKeyEvents(window); // optional
		controls.target.set(initialCameraValues.position.x, initialCameraValues.position.y, 5);
		controls.update();
		return controls;
	}

	function clean() {
		const controls = get(controls$);
		if (!controls) return;

		controls.dispose();
		const camera = get(camera$);
		if (!camera || !initialCameraValues) return;

		camera.position.copy(initialCameraValues.position);
		camera.rotation.copy(initialCameraValues.rotation);
	}

	function handleKeyPress(event: KeyboardEvent) {
		console.log(event);
		if (event.key === 'o') {
			switchControls();
		}
	}

	function destroy() {
		window.removeEventListener('keyup', handleKeyPress);
		clean();
		unsubscribe?.();
		destroyed = true;
	}

	function switchControls() {
		enabled$.update(($enabled$) => !$enabled$);
	}
}

export type CreateControls$Input = {
	renderer$: Renderer$;
	camera$: Camera$;
	enabled: boolean;
};

export type Controls$ = ReturnType<typeof createControls$>;

function getInitialCameraValues(camera: Camera) {
	return {
		position: camera.position.clone(),
		rotation: camera.rotation.clone()
	} as InitialCameraValues;
}

interface InitialCameraValues {
	position: Vector3;
	rotation: Euler;
}
