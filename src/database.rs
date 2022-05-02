use crate::{equipment::Weight, exercises::WorkoutEntry};
use rocket::request::FromRequest;
use serde::{Deserialize, Serialize};

use rocket_db_pools::{sqlx, Database};
use sqlx::{Connection, SqliteConnection, SqlitePool};

#[derive(Database)]
#[database("sqlite_db")]
pub struct Db(sqlx::sqlite::SqlitePool);

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
pub struct WorkoutID {
    pub id: String, // technically this should be a uuid... (isnt deserializable)
    pub user: User,
    pub timestamp: String,
}

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
pub struct User {
    pub name: String,
    pub email: String,
    pub password: String,
}

// Is this even needed?
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_user() {
        let user = User {
            name: "test".to_string(),
            email: "test@example.com".to_string(),
            password: "password".to_string(),
        };
        assert_eq!(user.name, "test");
        assert_eq!(user.email, "test@example.com");
        assert_eq!(user.password, "password");
    }

    #[test]
    fn test_workout_id() {
        let time = std::time::UNIX_EPOCH
            .elapsed()
            .unwrap()
            .as_secs()
            .to_string();
        let uuid = uuid::Uuid::new_v4().to_string();
        let user = User {
            name: "test".to_string(),
            email: "test@example.com".to_string(),
            password: "password".to_string(),
        };
        let workout_id = WorkoutID {
            id: uuid.clone(),
            user,
            timestamp: time.clone(),
        };
        assert_eq!(workout_id.id, uuid);
        assert_eq!(workout_id.user.name, "test");
        assert_eq!(workout_id.timestamp, time);
    }
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
