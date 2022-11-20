<script lang="ts">
	import * as THREE from 'three';
	import { onMount } from 'svelte';
	import questionMarkSvg from '$lib/images/question-mark.svg';
	import RoundEdgedBoxFlat from './RoundEdgedBoxFlat';
	import { getGameContext$ } from './+page.svelte';
	import { quadIn, quadOut } from 'svelte/easing';
	import tweenTo from '$lib/logic/tween';
	import { Vector3 } from 'three';

	/**
	 * `true` is face up, `false` is face down
	 */
	export let side: boolean = false;

	const game$ = getGameContext$();

	let mesh: THREE.Mesh;

	onMount(() => {
		const geometry = RoundEdgedBoxFlat(0.8, 1, 0.01, 0.02, 10);

		const backTexture = $game$.textureLoader.load(questionMarkSvg);
		const material: THREE.Material[] = [
			new THREE.MeshBasicMaterial({
				map: backTexture,
				side: THREE.DoubleSide
			}),
			new THREE.MeshBasicMaterial({
				color: 0xffffff,
				side: THREE.DoubleSide
			}),
			new THREE.MeshBasicMaterial({
				color: 0xffff00,
				side: THREE.DoubleSide
			})
		];

		let destroyMesh: () => void | undefined;
		const removeOnTextureLoadListener = $game$.addTextureLoadListener(() => {
			destroyMesh = initMesh();
		});

		function initMesh() {
			mesh = new THREE.Mesh(geometry, material);

			let angle = 0.2;
			const yAxis = new THREE.Vector3(0, 1, 0);
			// mesh.quaternion.copy(new THREE.Quaternion().setFromAxisAngle(yAxis, Math.PI * (1 + angle)));
			mesh.rotation.setFromVector3(new Vector3(0, Math.PI * (2 + angle), 0));

			filpCard(side);

			$game$.scene.add(mesh);

			const removeMeshClickListener = $game$.addMeshClickListener(
				mesh,
				({ event, intersection }) => {
					filpCard(!side);
				}
			);

			return () => {
				removeMeshClickListener();
			};
		}

		return () => {
			destroyMesh?.();
			removeOnTextureLoadListener();
			geometry.dispose();
			backTexture.dispose();
			material.forEach((m) => m.dispose());
			$game$.scene.remove(mesh);
		};
	});

	async function filpCard(newSide: boolean) {
		side = newSide;

		let angle = 0.2; // TODO: just for testing, to remove

		let r: Vector3[];
		let p: Vector3[];

		if (side) {
			// face up
			const r0 = new Vector3().setFromEuler(mesh.rotation.clone());
			const r1 = new Vector3(0, Math.PI * (1 + angle), 0);

			if (r0.y < r1.y - Math.PI * 2) {
				// Avoid difference between r0 and r1 to be larger than 2PI to avoid uncessary rotations
				r0.add(new Vector3(0, Math.PI * 2, 0));
			}

			r = [r0, r1];
			p = [
				new THREE.Vector3(mesh.position.x, mesh.position.y, 0),
				new THREE.Vector3(mesh.position.x, mesh.position.y, 1),
				new THREE.Vector3(mesh.position.x, mesh.position.y, 0)
			];
		} else {
			// face down
			const r0 = new Vector3().setFromEuler(mesh.rotation.clone());
			const r1 = new Vector3(0, Math.PI * angle, 0);

			if (r0.y > r1.y) {
				// Avoid difference between r0 and r1 to be larger than 2PI to avoid uncessary rotations
				r0.sub(new Vector3(0, Math.PI * 2, 0));
			}

			r = [r0, r1];
			p = [
				new Vector3(mesh.position.x, mesh.position.y, 0),
				new Vector3(mesh.position.x, mesh.position.y, 1),
				new Vector3(mesh.position.x, mesh.position.y, 0)
			];
		}

		tweenR(r[0], r[1], {
			duration: 500,
			easing: quadOut
		});

		tweenP(p[0], p[1], {
			duration: 250,
			easing: quadOut
		}).then(() =>
			tweenP(p[1], p[2], {
				duration: 250,
				easing: quadIn
			})
		);

		function tweenR(
			startValue: Vector3,
			endValue: Vector3,
			options: {
				duration: number;
				easing: (t: number) => number;
			}
		) {
			return tweenTo(
				startValue,
				endValue,
				(r) => {
					mesh.rotation.setFromVector3(r);
				},
				{ ...options, interpolate: (a, b) => (t) => a.clone().lerp(b, t) }
			);
		}

		function tweenP(
			startValue: Vector3,
			endValue: Vector3,
			options: {
				duration: number;
				easing: (t: number) => number;
			}
		) {
			return tweenTo(
				startValue,
				endValue,
				(p) => {
					mesh.position.copy(p);
				},
				{ ...options, interpolate: (a, b) => (t) => a.clone().lerp(b, t) }
			);
		}

		// TODO: https://codepen.io/jakedowns/pen/ExoqYRm
	}
</script>
