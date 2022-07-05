<script>
	import SveltyPicker from 'svelty-picker';
	import Exercise from '$lib/WorkoutView.svelte';
	import { addexercise } from '$lib/Exercise.svelte';
	import { json_data } from '$lib/json_store.js';
	import SetEntryForm from '$lib/SetEntryForm.svelte';
	import { get_current_user } from '$lib/json_store.js';
	import { onMount } from 'svelte';
	import {get_iso8601 } from '$lib/util.js';
	let login_status = false;
	onMount(async () => {
		get_current_user();
		login_status = json_data.user != '' ? true : false;
	});

	$: start_time_bind = get_iso8601();
	$: start_time = null;
	$: end_time = null;
	$: duration_bind = 0;

	$: set_count_bind = 0;
	$json_data.volume.weight = 0;
	console.log($json_data.volume);
	function handle_time(time) {
		let new_time = Math.floor(new Date(time).getTime() / 1000);
		{
			start_time = new_time;
		}
		{
			$json_data.start_time = new_time;
		}

		return new_time;
	}

	function handle_duration(time, duration) {
		let end = handle_time(time) + duration * 60;
		{
			end_time = end;
		}
		{
			$json_data.end_time = end;
		}

		return end;
	}

	function validate_json() {
		let valid = true;

		if ($json_data.exercises.length == 0) {
			console.log('No exercises');
			valid = false;
		}

		if ($json_data.start_time < 10000) {
			console.log('No start time');
			valid = false;
		}

		if ($json_data.end_time < 10000) {
			console.log('No end time');
			valid = false;
		}

		if ($json_data.end_time < $json_data.start_time) {
			console.log('End time before start time');
			valid = false;
		}

		if ($json_data.user == '') {
			console.log('No user');
			valid = false;
		}

		// Reset volume
		$json_data.volume.weight = 0.0;
		// Change weight unit
		$json_data.volume.weight_unit = $json_data.exercises[0].sets[0].weight.weight_unit;

		// Convert any stringed numbers to numbers
		for (let i = 0; i < $json_data.exercises.length; i++) {
			for (let j = 0; j < $json_data.exercises[i].sets.length; j++) {
				$json_data.exercises[i].sets[j].reps = Number($json_data.exercises[i].sets[j].reps);
				$json_data.exercises[i].sets[j].weight.weight = Number(
					$json_data.exercises[i].sets[j].weight.weight
				);
				// Build volume of workout
				// TODO: Find a better way to make a floating point
				$json_data.volume.weight += parseFloat(
					$json_data.exercises[i].sets[j].weight.weight * $json_data.exercises[i].sets[j].reps + 0.1
				);
			}
		}
		return valid;
	}

	function deleteExercise(exercise) {
		let index = $json_data.exercises.indexOf(exercise);

		if (index > -1) {
			json_data.update((data) => {
				data.exercises.splice(index, 1);
				return data;
			});
		}
	}

	function post() {
		if (validate_json()) {
			let data = JSON.stringify($json_data);
			let url = '/api/workouts/json';
			fetch(url, {
				method: 'POST',
				body: data,
				headers: {
					'Content-Type': 'application/json'
				}
			}).then((response) => {
				if (response.status == 200) {
					console.log('Successfully posted workout, redirecting...');
					window.location.href = response.url;
				} else {
					// TODO: Add notification ui for failed post
					console.log('Failed to post workout: ' + response.status);
				}
			});
		} else {
			console.log('Invalid workout!');
		}
	}
</script>

<svelte:head>
	<title>WLRS - New Workout</title>
</svelte:head>

<div class="separator" id="metadata">
	<h1>
		New Workout: <input
			type="text"
			name="title"
			class="border-0 border-b-2 mb-1 border-primary-500 hover:border-primary-500 focus:hover:border-primary-500"
			placeholder="Push Day"
			bind:value={$json_data.title}
		/>
	</h1>
	<hr />
	<p>By: {$json_data.user}</p>
	<p>
		Start: <SveltyPicker
			inputClasses="form-control inline border-0 border-b-2 mb-1 border-primary-500 hover:border-primary-500 focus:hover:border-primary-500"
			format="yyyy-mm-dd hh:ii"
			style="border:white 1px;"
			bind:value={start_time_bind}
			on:change={handle_time(start_time_bind)}
		/>
	</p>
	<p>
		Duration: <input
			type="number"
			class="form-control inline w-12 border-0 border-b-2 mb-1 border-primary-500 hover:border-primary-500 focus:hover:border-primary-500"
			id="duration"
			placeholder="Duration in minutes"
			min="0"
			max="360"
			required
			bind:value={duration_bind}
			on:change={handle_duration(start_time_bind, duration_bind)}
		/><span class="validity inline" />
	</p>
</div>

<div class="separator" id="create">
	<h1>Add Exercise</h1>
	<hr />
	<p class="mt-5">
		Exercise: <input
			type="text"
			class="form-control inline border-0 border-b-2 mb-1 border-primary-500 hover:border-primary-500 focus:hover:border-primary-500"
			id="exercisename"
			placeholder="Bench Press"
			maxlength="100"
			required
		/><span class="validity inline" />
	</p>
	<p class="mt-5">
		Comments: <input
			type="text"
			class="form-control inline border-0 border-b-2 mb-1 border-primary-500 hover:border-primary-500 focus:hover:border-primary-500"
			id="comments"
			placeholder="(optional)"
			maxlength="5000"
		/><span class="validity inline" />
	</p>
	<label class="mt-5">
		Sets: <input
			type="number"
			class="form-control inline w-12 border-0 border-b-2 mb-1 border-primary-500 hover:border-primary-500 focus:hover:border-primary-500"
			id="sets"
			placeholder="Sets"
			min="0"
			max="25"
			required
			bind:value={set_count_bind}
		/><span class="validity inline" />
	</label>
	<div id="setsdiv">
		{#if set_count_bind > 0 && set_count_bind <= 25}
			{#each { length: set_count_bind } as _}
				<SetEntryForm />
			{/each}
		{/if}
	</div>
	<button type="submit" class="btn btn-primary hover:bg-primary-500 mt-5" id="add-exercise" on:click={addexercise}
		>Add</button
	>
</div>

{#if $json_data.exercises.length != 0}
<div class="separator" id="exercises">
	<h1>Exercises</h1>
	<hr />
	{#each $json_data.exercises as exercise}
		<Exercise {exercise} on:delete={deleteExercise(exercise)} />
	{/each}
</div>
{/if}

<div class="separator" id="submit">
	<h1>Submit</h1>
	<hr />
	<button type="submit" class="btn btn-primary hover:bg-primary-500 mt-5" id="submit-workout" on:click={post}>Submit</button>
</div>

<hr />
<code lang="json">
	<pre>
                        {JSON.stringify($json_data, null, 2)}
                    </pre>
</code>

<style>
	.separator {
		background: #2b2b2b;
		border-radius: 33px;
		padding: 15px;
		margin: 10px;
	}

	:global(.numberform) {
		max-width: 150px;
	}

    code {
        color: white;
    }
</style>
