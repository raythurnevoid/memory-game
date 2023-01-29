import { browser } from '$app/environment';
import { derived, get, type Readable } from 'svelte/store';
import { type Mesh, Raycaster, Camera, Vector2, WebGLRenderer, type Intersection } from 'three';
import type { Camera$ } from './camera';
import type { Renderer$ } from './renderer';

export function createPointerHandler$(input: CreatePointerHandler$Input) {
	let destroyed = false;

	const { renderer$, camera$ } = input;
	let raycaster: Raycaster | undefined = undefined;
	let clickListeners: [Mesh, ClickListener][] = [];
	let pointer: Pointer | undefined = undefined;

	const pointerHandler$ = derived([renderer$, camera$], ([renderer, camera]) => {
		if (!browser || destroyed) return undefined;
		clean();
		if (!renderer || !camera) return undefined;

		raycaster ??= new Raycaster();

		renderer.domElement.addEventListener('pointermove', handlePointerMove, {
			passive: true
		});
		renderer.domElement.addEventListener('click', handleClick);

		return {
			addMeshClickListener(mesh: Mesh, listener: ClickListener) {
				clickListeners.push([mesh, listener]);

				return () => {
					const listenerToRemove = listener;
					const meshToRemove = mesh;
					clickListeners = clickListeners.filter(
						([mesh]) => mesh !== meshToRemove && listener !== listenerToRemove
					);
				};
			}
		};
	});

	return { ...pointerHandler$, destroy };

	function handlePointerMove(event: PointerEvent) {
		if (!pointer) {
			pointer = { x: 0, y: 0 };
		}

		pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
		pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
	}

	function handleClick(domEvent: MouseEvent) {
		const camera = get(camera$);
		if (!pointer || !raycaster || !camera) return;

		domEvent.preventDefault();
		raycaster.setFromCamera(pointer, camera);
		const meshesListening = Array.from(new Set(clickListeners.map(([mesh]) => mesh)));
		const intersections = raycaster.intersectObjects(meshesListening);
		if (intersections.length) {
			const intersection = intersections[0];
			const listenersToCall = clickListeners
				.filter(([mesh]) => mesh === intersection.object)
				.map(([, listener]) => listener);
			listenersToCall.forEach((listener) => listener({ domEvent, intersection }));
		}
	}

	function clean() {
		const renderer = get(renderer$);
		renderer?.domElement.removeEventListener('pointermove', handlePointerMove);
		renderer?.domElement.removeEventListener('click', handleClick);
	}

	function destroy() {
		clean();
		destroyed = true;
	}
}

export interface CreatePointerHandler$Input {
	renderer$: Renderer$;
	camera$: Camera$;
}

export type ClickListener = (event: ClickEvent) => void;
export interface ClickEvent {
	domEvent: MouseEvent;
	intersection: Intersection;
}

interface Pointer {
	x: number;
	y: number;
}
