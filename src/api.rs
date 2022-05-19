use rocket::State;
use rocket_db_pools::Connection;
use sqlx::{Row, SqlitePool};
use uuid::Uuid;

use crate::{database::Db, exercises::WorkoutEntry};

#[get("/workouts/<id>/json")]
pub async fn workout_json(
    id: String,
    mut db: Connection<Db>,
) -> Result<serde_json::Value, serde_json::Value> {
    // Query the database via ID, return data column
    //let wrap_data = sqlx::query!("SELECT * FROM workout WHERE id = ?", id).fetch_one(&mut *db);
    let wrap_data = sqlx::query("SELECT * FROM workout WHERE id = ?")
        .bind(id)
        .fetch_one(&mut *db);

    // If workout doesn't exist, 404.
    match wrap_data.await {
        Ok(wrap_data) => {
            let str: &str = wrap_data.try_get("data").unwrap();
            return Ok(serde_json::from_str(str).unwrap());
        }
        Err(_) => {
            return Err(serde_json::from_str("{\"error\": \"Workout not found!\"}").unwrap());
        }
    }
}

#[post("/workouts/json", format = "json", data = "<data>")]
pub async fn workout_post_json(data: rocket::serde::json::Json<WorkoutEntry>, conn: &State<SqlitePool>) -> rocket::response::Redirect {
    // "Unwrap" Json<WorkoutEntry> to WorkoutEntry
    let val: WorkoutEntry = data.into_inner();
    // Generate UUID
    let uuid = Uuid::new_v4();
    debug!("Creating workoutentry with {}", uuid);
    crate::database::insert_workout(uuid, val, &**conn).await;
    rocket::response::Redirect::to(format!("/workouts/{}", uuid))
}