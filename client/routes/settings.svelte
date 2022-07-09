<script>
	import { onMount } from 'svelte';
	import { json_data, get_current_user } from '$lib/json_store.js';

	onMount(() => {
		get_current_user();
		let login_status = json_data != '' ? true : false;
		console.log(login_status);
		if (!login_status) {
			window.location.href = '/login';
		}
	});
</script>

<svelte:head>
	<title>WLRS - Settings</title>
</svelte:head>

<div class="separator">
	<h1 class="font-bold">Settings</h1>
	<hr />
	<div id="visual">
		<label class="block">Dark Mode: <input type="checkbox" class="toggle relative mt-2"/></label>
		<label class="block">Show Exercise Volume Graph: <input type="checkbox" class="toggle relative mt-2"/></label>
		<label class="block">Show Exercise PR Graph: <input type="checkbox" class="toggle relative mt-2"/></label>
		<label class="block">Show Body Weight Graph: <input type="checkbox" class="toggle mt-2"/></label>
		<label class="block">Show Workout Frequency Graph: <input type="checkbox" class="toggle relative mt-2"/></label>
	</div>
</div>
