<script>
    import AuthBox from "$lib/AuthBox.svelte";
    import LoggedInAlready from "$lib/LoggedInAlready.svelte";
    import { get_current_user, json_data } from "$lib/json_store.js";
    import { onMount } from "svelte";
    let login_status = true; // render the `AuthBox` by defauly to prevent flashes
    onMount(() => {
        get_current_user();
        login_status = json_data != "" ? true : false;
    });
</script>

<svelte:head>
	<title>WLRS - Login</title>
</svelte:head>

{#if login_status}
    <AuthBox auth_type="Login" endpoint="/api/login" />
{:else}
    <LoggedInAlready />
{/if}