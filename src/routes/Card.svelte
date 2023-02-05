<script lang="ts">
	import * as THREE from 'three';
	import { onMount } from 'svelte';
	import questionMarkSvg from '$lib/images/question-mark.svg';
	import RoundEdgedBoxFlat from './RoundEdgedBoxFlat';
	import { getGameContext$ } from './+page.svelte';
	import { quadIn, quadOut } from 'svelte/easing';
	import tweenTo from '$lib/logic/tween';
	import { Vector3 } from 'three';
	import { getCardSize, getGameGridZ, type Position } from '../lib/logic/game-grid';

	/**
	 * `true` is face up, `false` is face down
	 */
	export let side: boolean = false;
	export let position: Position = {
		x: 0,
		y: 0
	};

	const game$ = getGameContext$();

	const cardSize = getCardSize();
	const cardInitialScale = 1;
	let mesh: THREE.Mesh;

	onMount(() => {
		const width = cardSize.w;
		const height = cardSize.h;
		const depth = 10;
		const geometry = RoundEdgedBoxFlat(width, height, depth, 0.02, 10);

		const backTexture = $game$.textureLoader.loadTexture(questionMarkSvg);
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
		const removeOnTextureLoadListener = $game$.textureLoader.addTextureLoadListener(() => {
			destroyMesh = initMesh();
		});

		function initMesh() {
			mesh = new THREE.Mesh(geometry, material);
			mesh.position.setX(position.x);
			mesh.position.setY(position.y);
			mesh.position.setZ(getGameGridZ() + depth * 0.5);
			mesh.scale.set(cardInitialScale, cardInitialScale, cardInitialScale);

			flipCard(side, false);

			$game$.scene.add(mesh);

			const removeMeshClickListener = $game$.addMeshClickListener(
				mesh,
				({ domEvent: event, intersection }) => {
					flipCard(!side);
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

	async function flipCard(newSide: boolean, animate = true) {
		const animationElevation = 0.5;

		side = newSide;

		const r = createRStages();

		if (!checkShouldAnimate(r)) {
			return;
		}

		tweenR(r);

		const p = createPStages();
		tweenP(p);

		const s = createSStages();
		tweenS(s);

		function createRStages() {
			let r: Vector3[];

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

			return r;
		}

		function createPStages() {
			const p: Vector3[] = [
				new THREE.Vector3(mesh.position.x, mesh.position.y, mesh.position.z),
				new THREE.Vector3(mesh.position.x, mesh.position.y, getGameGridZ() + cardSize.w),
				new THREE.Vector3(mesh.position.x, mesh.position.y, getGameGridZ())
			];

			return p;
		}

		function createSStages() {
			const endScale = cardInitialScale + animationElevation;

			const s: Vector3[] = [
				new THREE.Vector3(mesh.scale.x, mesh.scale.y, 1),
				new THREE.Vector3(endScale, endScale, 1),
				new THREE.Vector3(cardInitialScale, cardInitialScale, cardInitialScale)
			];

			return s;
		}

		function checkShouldAnimate(r: Vector3[]) {
			return r[0].y !== r[1].y;
		}

		function tweenR(r: Vector3[]) {
			tweenAndSetRotation(r[0], r[1], {
				duration: animate ? 500 : 0,
				easing: quadOut
			});

			function tweenAndSetRotation(
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
		}

		function tweenP(p: Vector3[]) {
			tweenAndSetPosition(p[0], p[1], {
				duration: animate ? 250 : 0,
				easing: quadOut
			}).then(() =>
				tweenAndSetPosition(p[1], p[2], {
					duration: animate ? 250 : 0,
					easing: quadIn
				})
			);

			function tweenAndSetPosition(
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
		}

		function tweenS(s: Vector3[]) {
			tweenAndSetScale(s[0], s[1], {
				duration: animate ? 250 : 0,
				easing: quadOut
			}).then(() =>
				tweenAndSetScale(s[1], s[2], {
					duration: animate ? 250 : 0,
					easing: quadIn
				})
			);

			function tweenAndSetScale(
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
		}
	}
</script>
