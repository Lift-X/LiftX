<script>
	import { onMount } from 'svelte';

	import { get } from 'svelte/store';
	import { get_current_user, json_data } from './json_store.js';
	let json_data_store = [];
	let login_status = false;
	onMount(async () => {
		await get_current_user();
		json_data_store = get(json_data);
		login_status = json_data_store.user != '' ? true : false;
		console.log(json_data_store);
		console.log(login_status);
	});
</script>
<div class="navbar bg-primary-500">
	<div class="flex-none max-w-5">
		<a id="logo" class="btn btn-ghost normal-case" href="/">
			<img src="/logo.png" alt="WLRS Logo" />
		</a>
	</div>
	<div class="flex-1" />
	<!--<svg height="20px" width="20px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" style="enable-background:new 0 0 24 24;" xml:space="preserve"><style type="text/css">.st0 {fill: none;}.st1 {fill: #ffffff;}</style><path class="st0" d="M0,0h24v24H0V0z" /><path class="st1" d="M12,12c3.3,0,6-2.7,6-6s-2.7-6-6-6S6,2.7,6,6S8.7,12,12,12z M12,15c-4,0-12,2-12,6v3h24v-3C24,17,16,15,12,15z"/></svg>-->
  <div class="dropdown dropdown-end">
    <label tabindex="0" class="btn btn-ghost btn-circle avatar">
			<div>
        <svg height="20px" width="20px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" style="enable-background:new 0 0 24 24;" xml:space="preserve"><style type="text/css">.st0 {fill: none;}.st1 {fill: #ffffff;}</style><path class="st0" d="M0,0h24v24H0V0z" /><path class="st1" d="M12,12c3.3,0,6-2.7,6-6s-2.7-6-6-6S6,2.7,6,6S8.7,12,12,12z M12,15c-4,0-12,2-12,6v3h24v-3C24,17,16,15,12,15z"/></svg>
			</div>
    </label>
    <ul tabindex="0" class="mt-3 p-2 shadow menu menu-compact dropdown-content rounded-box w-52 bg-black-500">
			{#if login_status}
      <li><a href="/home">Home</a></li>
	  <li><a href="/workouts/new">New Workout</a></li>
      <li><a href="/settings">Settings</a></li>
      <li><a href="/logout" rel="external">Logout</a></li>
      {:else}
      <li><a href="/register">Register</a></li>
      <li><a href="/login">Login</a></li>
      {/if}
    </ul>
  </div>
</div>

<style>
	#logo {
		max-height: 75px;
	}
	#logo img {
		max-height: 150%;
		bottom: 10px;
		position: relative;
	}

  .dropdown ul li a {
    color: white;
    text-decoration: none;
  }
  .dropdown ul li a:hover {
    background-color: #707070;
  }
</style>
