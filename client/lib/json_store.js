import { writable, get } from 'svelte/store';

export const json_data = writable({
	user: '',
	uuid: '', // Will be generated server side
	title: '',
	end_time: 0,
	start_time: 0,
	exercises: [],
	volume: {
		weight: 0.0,
		weight_unit: 'lbs'
	}
});

export const settings = writable({
	user: '',
	updated: 0,
	language: 'en-US',
	theme: 'dark',
	show_graph_exercise: true,
	show_graph_volume: true,
	show_graph_weight: true,
	show_graph_workout_frequency: true
});

// TODO: fetch current user api, if it says not logged in run `previously_logged_in()`

export async function get_current_user() {
	// If logged in, don't make unneeded api calls
	// Retrieve json_data svelte store
	let json_data_store = get(json_data);
	if (json_data_store.user !== '' && document.cookie.includes('rocket_auth=')) {
		return;
	} else if (json_data_store.user == '' && document.cookie.includes('rocket_auth')) {
		previously_logged_in();
	}

	const response = await fetch('/api/user/');
	const data = await response.json();
	if (data.error == null) {
		json_data.update((old) => {
			old.user = data.name;
			return old;
		});
	} else {
		previously_logged_in();
	}
}

// Clears data from a previous session
async function previously_logged_in() {
	console.log('Logging out');

	// Clear workouts-cache
	let cache = await caches.open('workouts-cache');
	cache.keys().then((keys) => {
		keys.forEach((key) => {
			cache.delete(key);
		});
	});

	// Delete rocket_auth cookie
	// I just spent 2 fucking hours just to find out the "HttpOnly" flag which is set by the auth library means I cant clear it client side
	// FML
	//document.cookie = "rocket_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

async function fetch_settings() {
	const response = await fetch('/api/user/settings');
	const data = await response.json();
	settings.update((old) => {
		old.user = data.user;
		old.updated = data.updated;
		old.language = data.language;
		old.theme = data.theme;
		old.show_graph_exercise = data.show_graph_exercise;
		old.show_graph_volume = data.show_graph_volume;
		old.show_graph_weight = data.show_graph_weight;
		old.show_graph_workout_frequency = data.show_graph_workout_frequency;
		return old;
	});
}
