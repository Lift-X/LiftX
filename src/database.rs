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
    pub email: String,
    pub password: String,
}

pub async fn create_connection() -> sqlx::SqlitePool {
    let pool = sqlx::SqlitePool::connect("sqlite_db").await.unwrap();
    pool
}

pub async fn build_tables(mut conn: SqliteConnection) {
    sqlx::query!("CREATE TABLE if not exists workout (id TINYTEXT PRIMARY KEY, date char(10), user TINYTEXT, data MEDIUMTEXT)")
        .execute(&mut conn)
        .await
        .unwrap();
}

/*pub async fn insert_workout(exercise: ExerciseEntry<'_>, mut conn: SqliteConnection) {
    let id = uuid::Uuid::new_v4().to_string();
    println!("Creating ExerciseEntry with id: {}...", id);
    let query = format!(
        "INSERT INTO workout (id, date, user, data) VALUES ('{}', '{}', 'John Doe', '{}')",
        id, std::time::UNIX_EPOCH.elapsed().unwrap().as_secs(), exercise.to_json()
    );
    sqlx::query(&query).execute(&mut conn).await.unwrap();
}*/

pub async fn insert_workout(exercise: WorkoutEntry<'_>, mut conn: SqliteConnection) {
    let id = uuid::Uuid::new_v4().to_string();
    println!("Creating ExerciseEntry with id: {}...", id);
    let query = format!(
        "INSERT INTO workout (id, date, user, data) VALUES ('{}', '{}', 'John Doe', '{}')",
        id,
        std::time::UNIX_EPOCH.elapsed().unwrap().as_secs(),
        exercise.to_json()
    );
    sqlx::query(&query).execute(&mut conn).await.unwrap();
}
