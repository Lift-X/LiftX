import { writable, get } from 'svelte/store';

export const json_data = writable({
	user: '',
	uuid: '', // Will be generated server side, anything added to this field will be overwritten
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
	show_reps_in_reserve: true,
});

export async function get_current_user() {
	// If logged in, don't make unneeded api calls
	// Retrieve json_data svelte store
	let json_data_store = get(json_data);
	if (json_data_store.user !== '' && document.cookie.includes('rocket_auth=')) {
		return true;
	} else if (json_data_store.user == '' && document.cookie.includes('rocket_auth')) {
		previously_logged_in();
		return false;
	}

	const response = await fetch('/api/user/');
	const data = await response.json();
	if (data.error == null) {
		json_data.update((old) => {
			old.user = data.name;
			return old;
		});
		return true;
	} else {
		previously_logged_in();
		return false;
	}
}

export async function get_current_settings() {
	let settings_store = get(settings);
	const response = await fetch('/api/user/settings');
	const data = await response.json();
	if (data.error == null) {
		settings.update((old) => {
			old = data;
			console.log(old);
			return old;
		});
	} else {
		throw new Error('Could not fetch settings: ' + data.error);
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
