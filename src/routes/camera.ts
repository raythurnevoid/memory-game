import { browser } from '$app/environment';
import { derived, writable, readable, get, type Readable } from 'svelte/store';
import { OrthographicCamera, PerspectiveCamera, type WebGLRenderer } from 'three';

export type CreateCameraInput = {
	type: 'perspective' | 'orthographic';
};

export function createCamera(input: CreateCameraInput): Readable<Camera> {
	if (!browser) {
		return readable<Camera>(undefined);
	}

	let type$ = writable(input.type);
	let camera$ = derived(type$, ($type$) => {
		const camera = createCameraInstance($type$);
		if ($type$ === 'perspective') {
			console.debug('PerspectiveCamera created');
		} else if ($type$ === 'orthographic') {
			console.debug('OrthographicCamera created');
		}

		return camera;
	});

	window.addEventListener('keyup', handleKeyPress);

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'p') {
			switchCamera();
		}
	}

	function destroy() {
		window.removeEventListener('keyup', handleKeyPress);
	}

	function switchCamera() {
		type$.update(($type$) => ($type$ === 'perspective' ? 'orthographic' : 'perspective'));
	}

	return derived(
		[camera$, type$],
		([$camera$, $type$]) =>
			({
				instance: $camera$,
				type: $type$,
				destroy
			} as Camera)
	);
}

function createCameraInstance(type: 'perspective' | 'orthographic') {
	// TODO: to improve, what if canvas is not full screen?
	const aspectRatio = window.innerWidth / window.innerHeight; // 16 / 9

	if (type === 'perspective') {
		const camera = new PerspectiveCamera(20, aspectRatio, 0.1, 1000);
		camera.position.set(1.8, -3, 25);

		return camera;
	} else if (type === 'orthographic') {
		const viewSize = 5;

		const camera = new OrthographicCamera(
			aspectRatio * -viewSize,
			aspectRatio * viewSize,
			viewSize,
			-viewSize,
			0.1,
			10
		);
		camera.position.set(1.8, -3, 10);

		return camera;
	} else {
		throw new Error('Invalid camera type');
	}
}

export type Camera = CameraBase &
	(
		| {
				instance: OrthographicCamera;
				type: 'orthographic';
		  }
		| {
				instance: PerspectiveCamera;
				type: 'perspective';
		  }
	);

interface CameraBase {
	destroy: () => void;
}