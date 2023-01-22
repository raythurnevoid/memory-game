<!-- https://github.com/daniel-lundin/dom-confetti/blob/master/src/main.js -->
<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import {
		DoubleSide,
		Group,
		Material,
		Matrix4,
		Mesh,
		MeshBasicMaterial,
		PlaneGeometry,
		Scene
	} from 'three';
	import { getGameContext$ } from './+page.svelte';
	import { rotate3d } from './rotate3d';
	import Sphere from './Sphere.svelte';

	export let origin: Position = { x: 0, y: 0, z: 0 };

	const dispatch = createEventDispatcher<{
		end: void;
	}>();

	let config: Partial<Config> = {};

	const game$ = getGameContext$();

	let fettis: Fettis | undefined;

	const defaultColors = ['#a864fd', '#29cdff', '#78ff44', '#ff718d', '#fdff6a'];
	const defaults: Config = {
		angle: 90,
		spread: 45,
		startVelocity: 45,
		elementCount: 50,
		width: 30,
		height: 30,
		perspective: '',
		colors: defaultColors,
		duration: 3000,
		stagger: 0,
		dragFriction: 0.1,
		random: Math.random
	};

	onMount(async () => {
		const evalConfig = Object.assign({}, defaults, config);

		// function confetti(root: Scene, config = {}) {
		// root.style.perspective = perspective;
		fettis = createElements($game$.scene, evalConfig);

		console.debug('animation start');

		/* return */ await animate(
			$game$.scene,
			fettis.items,
			evalConfig.dragFriction,
			evalConfig.duration,
			evalConfig.stagger
		);
		// }

		console.debug('animation end');

		dispatch('end');

		return () => {
			destroy();
		};
	});

	function randomPhysics(
		angle: Config['angle'],
		spread: Config['spread'],
		startVelocity: Config['startVelocity'],
		random: () => number
	): Physics {
		const radAngle = angle * (Math.PI / 180);
		const radSpread = spread * (Math.PI / 180);
		return {
			x: origin.x,
			y: origin.y,
			z: origin.z,
			wobble: random() * 10,
			wobbleSpeed: 0.1 + random() * 0.1,
			velocity: startVelocity * 0.5 + random() * startVelocity,
			angle2D: -radAngle + (0.5 * radSpread - random() * radSpread),
			angle3D: -(Math.PI / 4) + random() * (Math.PI / 2),
			tiltAngle: random() * Math.PI,
			tiltAngleSpeed: 0.1 + random() * 0.3
		};
	}

	function updateFetti(fetti: Fetti, progress: number, dragFriction: Config['dragFriction']) {
		fetti.physics.x += Math.cos(fetti.physics.angle2D) * fetti.physics.velocity;
		fetti.physics.y -= Math.sin(fetti.physics.angle2D) * fetti.physics.velocity;
		fetti.physics.z += Math.sin(fetti.physics.angle3D) * fetti.physics.velocity;
		fetti.physics.wobble += fetti.physics.wobbleSpeed;
		fetti.physics.velocity -= fetti.physics.velocity * dragFriction;
		fetti.physics.y -= 3;
		fetti.physics.tiltAngle += fetti.physics.tiltAngleSpeed;

		const { x, y, z, tiltAngle, wobble } = fetti.physics;
		const wobbleX = x + 10 * Math.cos(wobble);
		const wobbleY = y + 10 * Math.sin(wobble);

		fetti.mesh.position.set(wobbleX, wobbleY, z);
		const matrix4 = new Matrix4();
		matrix4.fromArray(rotate3d(1, 1, 1, tiltAngle).flatMap((row) => row));
		fetti.mesh.rotation.setFromRotationMatrix(matrix4);
		fetti.mesh.material.opacity = 1 - progress;
	}

	function animate(
		root: Scene,
		fettis: Fetti[],
		dragFriction: Config['dragFriction'],
		duration: Config['duration'],
		stagger: Config['stagger']
	) {
		let startTime: number;

		return new Promise((resolve) => {
			function update(time: number) {
				if (!startTime) startTime = time;

				const elapsed = time - startTime;
				const progress = startTime === time ? 0 : (time - startTime) / duration;
				fettis.slice(0, Math.ceil(elapsed / stagger)).forEach((fetti) => {
					updateFetti(fetti, progress, dragFriction);
				});

				if (time - startTime < duration || !fettis.length) {
					requestAnimationFrame(update);
				} else {
					destroy(root, fettis);
					resolve(undefined);
				}
			}

			requestAnimationFrame(update);
		});
	}

	function createElements(root: Scene, config: Config) {
		// define a group of meshes
		const fettis: Fettis = {
			group: new Group(),
			items: [],
			destroy
		};

		fettis.items = Array.from({ length: config.elementCount }).map((_, index) => {
			const element = new PlaneGeometry(config.width, config.height, 32);
			const color = config.colors[index % config.colors.length];
			const material = new MeshBasicMaterial({ color: color, side: DoubleSide, transparent: true });
			material.opacity = 0;
			const mesh = new Mesh(element, material);
			// root.add(mesh);
			fettis.group.add(mesh);

			return {
				mesh,
				physics: randomPhysics(config.angle, config.spread, config.startVelocity, config.random)
			};
		});

		fettis.group.rotateX(Math.PI / 2);

		root.add(fettis.group);

		function destroy() {
			if (!fettis) return;

			root.remove(fettis.group);
			fettis.group.remove(...fettis.items.map((fetti) => fetti.mesh));
		}

		return fettis;
	}

	function destroy() {
		fettis?.destroy();
		fettis = undefined;
	}

	interface Config {
		angle: number;
		spread: number;
		startVelocity: number;
		elementCount: number;
		width: number;
		height: number;
		perspective: string;
		colors: string[];
		duration: number;
		stagger: number;
		dragFriction: number;
		random: () => number;
	}

	interface Physics {
		x: number;
		y: number;
		z: number;
		wobble: number;
		wobbleSpeed: number;
		velocity: number;
		angle2D: number;
		angle3D: number;
		tiltAngle: number;
		tiltAngleSpeed: number;
	}

	interface Fetti {
		mesh: Mesh<PlaneGeometry, Material>;
		physics: Physics;
	}

	interface Fettis {
		group: Group;
		items: Fetti[];
		destroy: () => void;
	}
</script>

<Sphere position={origin} color="red" />
