<script>
	import Exercise from '$lib/WorkoutRawView.svelte';
	export let id;
	const cacheName = 'workouts-cache';
	let request = '';
	export async function load_json() {
		const response = await fetch(request);
		const responseJson = await response.clone().json();
		if (responseJson.error != null) {
			// Hide workout section
			document.getElementById('workout').style.display = 'none';
			throw new Error(responseJson.error);
		} else {
			const cache = await caches.open(cacheName);
			cache.put(request, response.clone());
			return responseJson;
		}
	}
	export function duration_from_secs(time) {
		let hours = Math.floor(time / 3600);
		let minutes = Math.floor((time - hours * 3600) / 60);
		let seconds = time - hours * 3600 - minutes * 60;
		return hours + 'h ' + minutes + 'm ' + seconds + 's';
	}
	export async function load_cache() {
		if (id == null) {
			// Get current url, and try that as a workout id
			const url = new URL(window.location.href);
			id = url.pathname.split('/').pop();
		}
		request = '/api/workouts/' + id + '/json';
		const cache = await caches.open(cacheName);
		const response = await cache.match(request);
		if (response != null) {
			const responseJson = await response.json();
			if (responseJson.error != null) {
				// Hide workout section
				document.getElementById('workout').style.display = 'none';
				throw new Error(responseJson.error);
			} else {
				console.log('Cache hit!');
				return responseJson;
			}
		} else {
			console.log('Cache miss!');
			return load_json();
		}
	}
	let json_data = load_cache();
	$: data = json_data;
</script>

<svelte:head>
	{#await data}
		<title>Loading...</title>
	{:then json}
		<title>LiftX - Workout: {json.title}</title>
	{:catch error}
		<title>LiftX - {error}</title>
	{/await}
</svelte:head>

<div id="content" class="max-w-xl m-auto">
	<div class="separator" id="metadata">
		{#await data}
			<p>Loading... please wait</p>
		{:then json}
			<h1>Workout: {json.title}</h1>
			<hr />
			<p>
				Duration: {duration_from_secs(json.end_time - json.start_time)}
			</p>
			<p>By: {json.user}</p>
		{:catch error}
			<center id="404">
				<h1>404</h1>
				<hr />
				<p>{error}</p>
			</center>
		{/await}
	</div>

	<div class="separator" id="workout">
		{#await data}
			<p>Loading... please wait</p>
		{:then json}
			<h1>Exercises</h1>
			<hr />
			{#each json.exercises as exercise}
				<Exercise {exercise} view_only="true" />
			{/each}
		{:catch error}
			<p>{error}</p>
		{/await}
	</div>
</div>
