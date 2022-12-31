<script lang="ts" context="module">
	const cardInitialScale = 1;
</script>

<script lang="ts">
	import * as THREE from 'three';
	import { onMount } from 'svelte';
	import questionMarkSvg from '$lib/images/question-mark.svg';
	import RoundEdgedBoxFlat from './RoundEdgedBoxFlat';
	import { gameBoardZ, getGameContext$ } from './+page.svelte';
	import { quadIn, quadOut } from 'svelte/easing';
	import tweenTo from '$lib/logic/tween';
	import { Vector3 } from 'three';
	import { cardSize, type Position } from './game-grid';

	/**
	 * `true` is face up, `false` is face down
	 */
	export let side: boolean = false;
	export let position: Position = [0, 0];

	const game$ = getGameContext$();

	let mesh: THREE.Mesh;

	onMount(() => {
		const geometry = RoundEdgedBoxFlat(cardSize[0], cardSize[1], 0.01, 0.02, 10);

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
			mesh.position.setX(position[0]);
			mesh.position.setY(position[1]);
			mesh.position.setZ(gameBoardZ);
			mesh.scale.set(cardInitialScale, cardInitialScale, cardInitialScale);

			filpCard(side, false);

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

	async function filpCard(newSide: boolean, animate = true) {
		const animationElevation = 0.5;

		side = newSide;

		let r: Vector3[];
		const p: Vector3[] = [
			new THREE.Vector3(mesh.position.x, mesh.position.y, mesh.position.z),
			new THREE.Vector3(mesh.position.x, mesh.position.y, gameBoardZ + animationElevation),
			new THREE.Vector3(mesh.position.x, mesh.position.y, gameBoardZ)
		];
		const s: Vector3[] = [
			new THREE.Vector3(mesh.scale.x, mesh.scale.y, 1),
			new THREE.Vector3(
				cardInitialScale + animationElevation,
				cardInitialScale + animationElevation,
				1
			),
			new THREE.Vector3(cardInitialScale, cardInitialScale, cardInitialScale)
		];

		if (side) {
			// face up
			const r0 = new Vector3().setFromEuler(mesh.rotation.clone());
			const r1 = new Vector3(0, Math.PI, 0);

			if (r0.y <= r1.y - Math.PI * 2) {
				// Avoid difference between r0 and r1 to be larger than 2PI to avoid uncessary rotations
				r0.setY(r0.y + Math.PI * 2);
			}

			r = [r0, r1];
		} else {
			// face down
			const r0 = new Vector3().setFromEuler(mesh.rotation.clone());
			const r1 = new Vector3(0, 0, 0);

			if (r0.y > r1.y) {
				// r0 must always be smaller than r1 to keep rotation direction correct
				r0.setY(r0.y - Math.PI * 2);
			}

			r = [r0, r1];
		}

		if (r[0].y === r[1].y) {
			return;
		}

		tweenR(r[0], r[1], {
			duration: animate ? 500 : 0,
			easing: quadOut
		});

		tweenP(p[0], p[1], {
			duration: animate ? 250 : 0,
			easing: quadOut
		}).then(() =>
			tweenP(p[1], p[2], {
				duration: animate ? 250 : 0,
				easing: quadIn
			})
		);

		tweenS(s[0], s[1], {
			duration: animate ? 250 : 0,
			easing: quadOut
		}).then(() =>
			tweenS(s[1], s[2], {
				duration: animate ? 250 : 0,
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

		function tweenS(
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
				(s) => {
					mesh.scale.copy(s);
				},
				{ ...options, interpolate: (a, b) => (t) => a.clone().lerp(b, t) }
			);
		}

		// TODO: https://codepen.io/jakedowns/pen/ExoqYRm
	}
</script>
