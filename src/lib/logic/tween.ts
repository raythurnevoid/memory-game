import { tweened as svelteTweened } from 'svelte/motion';

export default async function tweenTo<T>(
	startValue: T,
	targetValue: T,
	onChange: (value: T) => void,
	options: {
		delay?: number;
		duration?: number | ((from: T, to: T) => number);
		easing?: (t: number) => number;
		interpolate?: (a: T, b: T) => (t: number) => T;
	}
) {
	const tweened = svelteTweened(startValue, options);

	const unsubscribe = tweened.subscribe((p) => {
		onChange(p);
	});

	await tweened.set(targetValue).then(unsubscribe);
}
