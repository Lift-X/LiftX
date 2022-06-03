import { writable } from "svelte/store";
import { get } from "svelte/store";

export const json_data = writable({
  user: "",
  uuid: "", // Will be generated server side
  title: "",
  end_time: 0,
  start_time: 0,
  exercises: [],
  volume: {
    weight: 0.0,
    weight_unit: "lbs",
  },
});

export async function get_current_user() {
  // If logged in, don't make uneeded api calls
  // Retrive json_data svelte store
  const json_data_store = get(json_data);
  if (json_data_store.user != "" && document.cookie.includes("rocket_auth=")) {
    console.log("Skipping user lookup");
    return;
  } else if (
    json_data_store.user == "" &&
    document.cookie.includes("rocket_auth=")
  ) {
    console.log("Previously logged in user not found, logging out");
    previously_logged_in();
  }
  console.log("Calling user api");
  const response = await fetch("/api/user/current");
  const data = await response.json();
  if (data.error == null) {
    json_data.update((old) => {
      old.user = data.name;
      return old;
    });
  } else {
    json_data.update((old) => {
      old.user = "";
      return old;
    });
  }
}

// Clears data from a previous session
async function previously_logged_in() {
  // Clear workouts-cache
  const cache = await caches.open("workouts-cache");
  cache.keys().then((keys) => {
    keys.forEach((key) => {
      cache.delete(key);
    });
  });

  // Delete rocket_auth cookie
  document.cookie =
    "rocket_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}
