import { browser } from '$app/environment';
import { get, readable } from 'svelte/store';
import { WebGLRenderer } from 'three';

export function createRenderer$() {
	let destroyed = false;

	const renderer$ = readable<WebGLRenderer | undefined>(undefined, (set) => {
		if (!browser || destroyed) return set(undefined);
		const renderer = createRenderer();
		set(renderer);
	});

	return {
		...renderer$,
		destroy
	};

	function createRenderer() {
		const renderer = new WebGLRenderer();
		renderer.setSize(window.innerWidth, window.innerHeight);
		return renderer;
	}

	function destroy() {
		get(renderer$)?.dispose();
		destroyed = true;
	}
}

export type Renderer$ = ReturnType<typeof createRenderer$>;
