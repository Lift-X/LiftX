use rocket_db_pools::Connection;

#[allow(unused_imports)]
use crate::database::{Db, WorkoutID};

#[get("/workout/<id>/json")]
pub async fn hello(id: String, mut db: Connection<Db>) -> serde_json::Value {
    // Query the database via ID, return data column
    let data = sqlx::query!("SELECT * FROM workout WHERE id = ?", id)
        .fetch_one(&mut *db)
        .await
        .unwrap()
        .data;
    // If workout exists in database, return it
    // Fun fact: I spent multiple hours trying to remove the "std::option::Option<String>" from the String. (reading docs is really helpful, kids.)
    match data {
        Some(data) => serde_json::from_str(&data).expect("Could not get valid json"), // already in json format
        None => serde_json::from_str("Workout not found!").expect("Could not get valid json"),
    }
}

#[get("/shutdown")]
pub async fn shutdown(shutdown: rocket::Shutdown) -> &'static str {
    shutdown.notify();
    "Shutting down..."
}
