import { browser } from '$app/environment';
import { derived, writable } from 'svelte/store';
import { OrthographicCamera, PerspectiveCamera } from 'three';

export function createCamera$(input: CreateCamera$Input) {
	let initialized = false;
	let destroyed = false;

	const { type } = input;
	let type$ = writable(type);

	let camera$ = derived(
		type$,
		(type) => {
			if (!browser || destroyed) return undefined;
			const camera = createThreeJsCamera(type);

			if (!initialized) {
				window.addEventListener('keyup', handleKeyPress);
			}

			initialized = true;
			return camera;
		},
		undefined
	);

	let unsubscribe: (() => void) | undefined = undefined;
	if (browser) {
		unsubscribe = camera$.subscribe(() => {});
	}

	return { ...camera$, destroy };

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'p') {
			switchCamera();
		}
	}

	function switchCamera() {
		type$.update((type) => (type === 'perspective' ? 'orthographic' : 'perspective'));
	}

	function destroy() {
		window.removeEventListener('keyup', handleKeyPress);
		unsubscribe?.();
		destroyed = true;
	}
}

export interface CreateCamera$Input {
	type: 'perspective' | 'orthographic';
}

export type Camera$ = ReturnType<typeof createCamera$>;

function createThreeJsCamera(type: 'perspective' | 'orthographic') {
	const aspectRatio = window.innerWidth / window.innerHeight;
	if (type === 'perspective') {
		// const camera = new PerspectiveCamera(20, aspectRatio, 0.1, 1000);
		const camera = new PerspectiveCamera(90, aspectRatio, 0.1, 10000);
		camera.position.set(1.8, -3, 500);

		return camera;
	} else {
		// type === 'orthographic'
		const camera = new OrthographicCamera(
			-window.innerWidth / 2,
			window.innerWidth / 2,
			window.innerHeight / 2,
			-window.innerHeight / 2,
			-10000,
			10000
		);
		camera.position.set(1.8, -3, 1000);

		return camera;
	}
}
