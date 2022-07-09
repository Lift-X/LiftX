<script>
	import { onMount } from 'svelte';
    import {json_data, get_current_user } from "$lib/json_store.js";

	onMount(() => {
		get_current_user();
		let login_status = json_data != '' ? true : false;
        console.log(login_status);
        if (!login_status) {
            window.location.href = "/login"
        }
	});
</script>

<svelte:head>
	<title>WLRS - Settings</title>
</svelte:head>

<div class="separator">
	<h1 class="font-bold">Settings</h1>
	<hr />
	<label
		>Show Exercise Graph: <input
			type="checkbox"
			class="toggle border-primary-500 bg-primary-500"
		/></label
	>
</div>
