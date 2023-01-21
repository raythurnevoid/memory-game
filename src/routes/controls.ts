import { derived, writable, type Readable, get } from 'svelte/store';
import type { WebGLRenderer } from 'three';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import type { Camera } from './camera';

export type CreateControlsInput = {
	renderer: WebGLRenderer;
	camera$: Readable<Camera>;
	enabled: boolean;
};

export function createControls(input: CreateControlsInput): Readable<Controls> {
	const enabled$ = writable(input.enabled);

	const initialCameraValues = getInitialCameraValues(get(input.camera$));

	const controls$ = derived([input.camera$, enabled$], ([$camera$, $enabled$]) => {
		if ($camera$.instance && $enabled$) {
			const controls = new OrbitControls($camera$.instance, input.renderer.domElement);

			controls.listenToKeyEvents(window); // optional

			controls.target.set(initialCameraValues.position.x, initialCameraValues.position.y, 5);
			controls.update();

			console.debug('OrbitControls enabled');

			return controls;
		} else {
			console.debug('OrbitControls disabled');

			const controls = get(controls$);
			if (controls) {
				controls.dispose();
				$camera$.instance.position.copy(initialCameraValues.position);
				$camera$.instance.rotation.copy(initialCameraValues.rotation);
			}

			return null;
		}
	});

	window.addEventListener('keyup', handleKeyPress);

	function handleKeyPress(event: KeyboardEvent) {
		console.log(event);
		if (event.key === 'o') {
			switchControls();
		}
	}

	function destroy() {
		window.removeEventListener('keyup', handleKeyPress);
		const controls = get(controls$);
		if (controls) {
			controls.dispose();
		}
	}

	function switchControls() {
		enabled$.update(($enabled$) => !$enabled$);
	}

	return derived(controls$, ($controls$) => ({
		instance: $controls$,
		destroy
	}));
}

function getInitialCameraValues(camera: Camera) {
	return {
		position: camera.instance.position.clone(),
		rotation: camera.instance.rotation.clone()
	};
}

export type Controls = {
	instance: OrbitControls | null;
	destroy: () => void;
};
