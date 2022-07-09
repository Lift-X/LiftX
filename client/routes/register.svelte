<script>
	import AuthBox from '$lib/AuthBox.svelte';
</script>

<svelte:head>
	<title>WLRS - Register</title>
</svelte:head>

<AuthBox auth_type="Register" endpoint="/api/register" />