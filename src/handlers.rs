use rocket::fs::NamedFile;
use rocket_db_pools::Connection;
use rocket_dyn_templates::{context, Template};

#[allow(unused_imports)]
use crate::database::{Db, WorkoutID};
use crate::{exercises::WorkoutEntry, util::timestamp_to_iso8601};

#[get("/workout/<id>/json")]
pub async fn workout_json(
    id: String,
    mut db: Connection<Db>,
) -> Result<serde_json::Value, serde_json::Value> {
    // Query the database via ID, return data column
    let data = sqlx::query!("SELECT * FROM workout WHERE id = ?", id)
        .fetch_one(&mut *db)
        .await
        .unwrap()
        .data;
    // If workout exists in database, return it
    // Fun fact: I spent multiple hours trying to remove the "std::option::Option<String>" from the String. (reading docs is really helpful, kids.)
    match data {
        Some(data) => Ok(serde_json::from_str(&data).expect("Could not get valid json")), // already in json format
        None => Err(serde_json::from_str("Workout not found!").unwrap()),
    }
}

#[get("/workout/<id>/view")]
pub async fn view(id: String, mut db: Connection<Db>) -> rocket_dyn_templates::Template {
    // Query the database via ID, return data column
    let data = sqlx::query!("SELECT * FROM workout WHERE id = ?", id)
        .fetch_one(&mut *db)
        .await.unwrap_or(return Template::render(
            "view",
            context! { workout_start: 0, workout_end: 0, workout_data: WorkoutEntry::default(), sets: WorkoutEntry::default().exercises, comments_not_empty: true },
        ))
        .data
        .unwrap();

    // inline most of this unless it's complex once working
    let entry = WorkoutEntry::from_json(&data);
    // Get date and time
    let workout_start = timestamp_to_iso8601(entry.start_time);
    let workout_end = timestamp_to_iso8601(entry.end_time);
    let comments_not_empty = !&entry.comments.is_empty();
    Template::render(
        "view",
        context! {
            workout_start: workout_start,
            workout_end: workout_end,
            // Workout items
            workout_data: &entry,
            sets: &entry.exercises,
            // Hide comments section if empty
            comments_not_empty: comments_not_empty,
        },
    )
}

#[get("/static/<file>")]
pub async fn static_file(file: String) -> Option<NamedFile> {
    NamedFile::open(format!("static/{}", file)).await.ok()
}

#[get("/shutdown")]
pub async fn shutdown(shutdown: rocket::Shutdown) -> &'static str {
    shutdown.notify();
    "Shutting down..."
}
