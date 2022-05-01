use crate::{equipment::Weight, exercises::WorkoutEntry};
use serde::{Deserialize, Serialize};

use rocket_db_pools::{sqlx, Database};
use sqlx::{SqliteConnection, Connection, SqlitePool};

#[derive(Database)]
#[database("sqlite_db")]
pub struct Db(sqlx::SqlitePool);

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
pub struct WorkoutID {
    pub id: User,
    pub timestamp: String,
}

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
pub struct User {
    pub name: String,
    pub email: String,
    pub password: String,
}

/*pub fn get_workout(id: WorkoutID) -> WorkoutEntry {
    // Get from database
}*/

pub async fn create_connection() -> sqlx::SqlitePool {
    let pool = sqlx::SqlitePool::connect("sqlite_db").await.unwrap();
    pool
}