#[allow(unused_imports)]
use crate::{equipment::Weight, exercises::WorkoutEntry};
use serde::{Deserialize, Serialize};

use rocket_db_pools::{sqlx, Database};
#[allow(unused_imports)]
use sqlx::{Connection, SqliteConnection, SqlitePool};

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

/*pub fn get_workout(id: WorkoutID) -> WorkoutEntry {
    // Get from database
}*/

pub async fn create_connection() -> sqlx::SqlitePool {
    let pool = sqlx::SqlitePool::connect("sqlite_db").await.unwrap();
    pool
}

/*pub fn build_tables() {
    sqlx::query!("CREATE TABLE workout (id TINYTEXT PRIMARY KEY, date char(10), user TINYTEXT, data MEDIUMTEXT, comments TEXT)")
        .execute(&mut conn)
        .await
        .unwrap();
}

pub fn example_exercise_entry() {
    sqlx::query!(
        "INSERT INTO workout (id, date, user, data, comments) VALUES ('28fcad1c-0f5b-49d1-8d5c-2286f15ff99a', '2020-01-01', 'John Doe', 'Bench Press - 8 Reps (135lbs, 1.5RiR) - 8 Reps (135lbs, 1.5RiR) - 8 Reps (135lbs, 1.5RiR)', 'comment')",
    ).execute(&mut conn).await.unwrap();
}
*/
