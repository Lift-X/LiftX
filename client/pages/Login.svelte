<script>
    import {get_current_user, json_data} from "../Components/json_store.js";
    import { onMount } from 'svelte';
    import LoggedInAlready from "../Components/LoggedInAlready.svelte";
    let login_status = false;
    onMount(() => {
        get_current_user();
        login_status = (json_data != "") ? true : false;
    });
    $: name = "";
    $: password = "";
</script>

{#if login_status}
<form action="/api/login" method="post">
        <label>
            <span>Username</span>
            <input name="name" type="text" bind:value="{name}" required/>
        </label>
        <label>
            <span>Password</span>
            <input name="password" type="password" bind:value="{password}" required/>
        </label>
        <button type="submit">Login</button>
</form>
{:else}
<LoggedInAlready/>
{/if}