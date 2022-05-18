use rocket::response::Redirect;
use rocket_db_pools::Connection;
use uuid::Uuid;

use crate::{database::Db, exercises::WorkoutEntry};

#[get("/workouts/<id>/json")]
pub async fn workout_json(
    id: String,
    mut db: Connection<Db>,
) -> Result<serde_json::Value, serde_json::Value> {
    // Query the database via ID, return data column
    let wrap_data = sqlx::query!("SELECT * FROM workout WHERE id = ?", id).fetch_one(&mut *db);

    // If workout doesn't exist, 404.
    match wrap_data.await {
        Ok(wrap_data) => {
            return Ok(serde_json::from_str(wrap_data.data.unwrap().as_str()).unwrap());
        }
        Err(_) => {
            return Err(serde_json::from_str("{\"error\": \"Workout not found!\"}").unwrap());
        }
    }
    // If workout exists in database, return it
    // Fun fact: I spent multiple hours trying to remove the "std::option::Option<String>" from the String. (reading docs is really helpful, kids.)
}

#[post("/workouts/json", format = "json", data = "<data>")]
pub async fn workout_post_json(data: rocket::serde::json::Json<WorkoutEntry>) -> rocket::response::Redirect {
    // TODO: Somehow connect to DB pool
    let conn =
    sqlx::ConnectOptions::connect(&<sqlx::sqlite::SqliteConnectOptions as std::str::FromStr> ::from_str("sqlite://data.db").unwrap().create_if_missing(true))
        .await
        .unwrap();
    // "Unwrap" Json<WorkoutEntry> to WorkoutEntry
    let val: WorkoutEntry = data.into_inner();
    // Generate UUID
    let uuid = Uuid::new_v4();
    println!("Creating workoutentry with {}", uuid);
    crate::database::insert_workout(uuid, val, conn).await;
    rocket::response::Redirect::to(format!("/workouts/{}", uuid))
}