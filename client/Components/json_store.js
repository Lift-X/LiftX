import { writable } from "svelte/store";

export const json_data = writable({});

export const updateJsonData = (data) => {
    json_data.update(data => )
}