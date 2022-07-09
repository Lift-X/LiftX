<script>
	import AuthBox from '$lib/AuthBox.svelte';
</script>

<svelte:head>
	<title>WLRS - Login</title>
</svelte:head>

<AuthBox auth_type="Login" endpoint="/api/login" />