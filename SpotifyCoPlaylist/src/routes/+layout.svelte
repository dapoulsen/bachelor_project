<script lang="ts">
	import '../app.css';
	
	let { children } = $props();
</script>

<nav>
	<a href="/">User</a>
	<a href="/admin">Admin</a>
</nav>

{@render children()}
