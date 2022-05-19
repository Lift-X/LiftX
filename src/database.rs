use crate::exercises::WorkoutEntry;
use serde::{Deserialize, Serialize};

use rocket_db_pools::{sqlx, Database};
use sqlx::SqliteConnection;

#[derive(Database)]
#[database("sqlite_db")]
pub struct Db(sqlx::sqlite::SqlitePool);

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
pub struct WorkoutID {
    pub uuid: String, // could be a plain uuid::Uuid but it's not deserializable
    pub user: User,
    pub timestamp: String,
}

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
pub struct User {
    pub name: String,
    pub password: String,
    pub id: String,
}

pub async fn create_connection() -> sqlx::SqlitePool {
    let pool = sqlx::SqlitePool::connect("sqlite_db").await.unwrap();
    pool
}

pub async fn build_tables(mut conn: SqliteConnection) {
    sqlx::query("CREATE TABLE if not exists workout (id TINYTEXT PRIMARY KEY, created char(12), user TINYTEXT, data MEDIUMTEXT)")
        .execute(&mut conn)
        .await
        .unwrap();
    warn!("Tables not found. Building.")
}

pub async fn insert_workout(uuid: uuid::Uuid, exercise: WorkoutEntry, mut conn: SqliteConnection) {
    debug!("Creating ExerciseEntry with id: {}...", uuid.to_string());
    let query = format!(
        "INSERT INTO workout (id, created, user, data) VALUES ('{}', '{}', '{}', '{}')",
        uuid.to_string(),
        std::time::UNIX_EPOCH.elapsed().unwrap().as_secs(),
        exercise.user,
        exercise.to_json()
    );
    sqlx::query(&query).execute(&mut conn).await.unwrap();
}
