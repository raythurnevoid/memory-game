<script lang="ts">
	import Confetti from './Confetti.svelte';

	let key = {};

	function restart() {
		key = {};
	}
</script>

{#key key}
	<Confetti on:end={restart} />
{/key}
