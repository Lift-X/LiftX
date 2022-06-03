<script>
    import AuthBox from "../Components/AuthBox.svelte";
    import { get_current_user, json_data } from "../Components/json_store.js";
    import { onMount } from "svelte";
    import LoggedInAlready from "../Components/LoggedInAlready.svelte";
    let login_status = false;
    onMount(() => {
        get_current_user();
        login_status = json_data != "" ? true : false;
    });
    $: name = "";
    $: password = "";
</script>

{#if login_status}
    <AuthBox auth_type="Login" endpoint="/api/login" />
{:else}
    <LoggedInAlready />
{/if}
