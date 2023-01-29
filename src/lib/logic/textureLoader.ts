import { browser } from '$app/environment';
import { readable } from 'svelte/store';
import { LoadingManager, Texture, TextureLoader as ThreeJsTextureLoader } from 'three';

export function createTextureLoader$() {
	let destroyed = false;
	const textureLoader$ = readable<TextureLoader | undefined>(undefined, (set) => {
		if (!browser || destroyed) return;

		const et = new EventTarget();
		const loadManager = new LoadingManager();
		const textureLoader = new ThreeJsTextureLoader(loadManager);

		loadManager.onLoad = () => et.dispatchEvent(new CustomEvent('textureLoad'));

		set({
			addTextureLoadListener: (listener: TextureLoadListener) => {
				et.addEventListener('textureLoad', listener, {
					once: true,
					passive: true
				});

				return () => et.removeEventListener('textureLoad', listener);
			},
			loadTexture: (url: string) => {
				return textureLoader.load(url);
			}
		});
	});

	return textureLoader$;
}

export type TextureLoader = {
	addTextureLoadListener: (listener: TextureLoadListener) => TextureLoadListenerUnsubscriber;
	loadTexture: (url: string) => Texture;
};

export type TextureLoadListener = () => Promise<undefined> | void;
export type TextureLoadListenerUnsubscriber = () => void;
