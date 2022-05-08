use rocket_db_pools::Connection;
use rocket_dyn_templates::{context, Template};
//use rocket_dyn_templates::{Template, context};

#[allow(unused_imports)]
use crate::database::{Db, WorkoutID};
use crate::exercises::WorkoutEntry;

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
        .await.unwrap()
        .data.unwrap();

    // inline most of this unless it's complex once working
    let entry = WorkoutEntry::from_json(&data);
    let workout_start = entry.start_time;
    let workout_end = entry.end_time;
    let items = entry.exercises.iter().map(|e| e.to_string_summary()).collect::<Vec<String>>();
    let comments = entry.comments;

    let t = Template::render("view", context! {
        workout_start: workout_start,
        workout_end: workout_end,
        items: items,
        comments: comments,
    });
    t
}


#[get("/shutdown")]
pub async fn shutdown(shutdown: rocket::Shutdown) -> &'static str {
    shutdown.notify();
    "Shutting down..."
}
