<script>
	import Header from './Header.svelte';
	import './styles.css';
</script>

<div class="app">
	<main>
		<slot />
	</main>

	<header>
		<Header />
	</header>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main,
	header {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
	}
</style>
