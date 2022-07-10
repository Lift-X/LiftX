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
	<div id="account">
		<a href="#delete-modal" class="btn btn-primary mt-5">Delete Account</a>
	</div>
	<hr/>
	<div id="visual">
		<label class="block">Dark Mode: <input type="checkbox" class="toggle relative mt-2"/></label>
		<label class="block">Show Exercise Volume Graph: <input type="checkbox" class="toggle relative mt-2"/></label>
		<label class="block">Show Exercise PR Graph: <input type="checkbox" class="toggle relative mt-2"/></label>
		<label class="block">Show Body Weight Graph: <input type="checkbox" class="toggle mt-2"/></label>
		<label class="block">Show Workout Frequency Graph: <input type="checkbox" class="toggle relative mt-2"/></label>
	</div>
</div>

<div class="modal" id="delete-modal">
	<div class="modal-box">
	  <h3 class="font-bold text-lg">Are you sure you want to delete your account?</h3>
	  <p class="py-4">This action is <span class="font-bold">permanent</span> and not reversible!</p>
	  <div class="modal-action">
	   <a href="#" class="btn btn-primary">No, take me back!</a><a href="/api/user/delete" rel="external" class="btn btn-primary">Yes, delete my account.</a>
	  </div>
	</div>
  </div>
