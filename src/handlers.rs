use rocket_db_pools::Connection;

#[allow(unused_imports)]
use crate::database::{Db, WorkoutID};

#[get("/workout/<id>")]
pub async fn hello(id: String, mut db: Connection<Db>) -> String {
    // Query the database via ID, return data column
    let data = sqlx::query!("SELECT * FROM workout WHERE id = ?", id)
        .fetch_one(&mut *db)
        .await
        .unwrap()
        .data;
    // If workout exists in database, return it
    // Fun fact: I spent multiple hours trying to remove the "std::option::Option<String>" from the String. (reading docs is really helpful, kids.)
    match data {
        Some(data) => data,
        None => "Workout not found!".to_string(),
    }
}

#[get("/shutdown")]
pub async fn shutdown(shutdown: rocket::Shutdown) -> &'static str {
    shutdown.notify();
    "Shutting down..."
}