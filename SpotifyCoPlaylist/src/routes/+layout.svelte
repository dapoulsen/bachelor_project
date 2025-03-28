<script lang="ts">
	import '../app.css';
	
	let { children } = $props();
</script>

<nav>
	<a href="/">User</a>
	<a href="/admin">Admin</a>
</nav>

{@render children()}

<style>
	nav {
		background-color: #333;
		color: white;
		padding: 1rem;
	}

	nav a {
		color: white;
		text-decoration: none;
		margin-right: 1rem;
	}
</style>
