use crate::exercises::WorkoutEntry;
use rocket_db_pools::Database;
use sqlx::{Row, SqlitePool};

#[derive(Database)]
#[database("sqlite_db")]
pub struct Db(sqlx::sqlite::SqlitePool);

pub async fn create_connection() -> sqlx::SqlitePool {
    let pool = sqlx::SqlitePool::connect("data.db").await.unwrap();
    pool
}

pub async fn build_tables(conn: SqlitePool) {
    // Workout Table
    sqlx::query("CREATE TABLE if not exists workout (id TINYTEXT PRIMARY KEY, created int, user TINYTEXT, data MEDIUMTEXT)")
        .execute(&conn)
        .await
        .unwrap();

    // User Table
    let users: rocket_auth::Users = conn.into();
    users.create_table().await.unwrap();
}

pub async fn insert_workout(uuid: uuid::Uuid, mut exercise: WorkoutEntry, conn: &SqlitePool) {
    debug!("Creating ExerciseEntry with id: {}...", uuid.to_string());
    let query = format!(
        "INSERT INTO workout (id, created, user, data) VALUES ('{}', '{}', '{}', '{}')",
        uuid,
        std::time::UNIX_EPOCH.elapsed().unwrap().as_secs(),
        exercise.user.clone(),
        exercise.to_json(uuid)
    );
    sqlx::query(&query).execute(conn).await.unwrap();
}

/// Get all workouts from the database.
/// Optionally provide a max number of workouts to return
pub async fn get_workouts(
    conn: &SqlitePool,
    user: String,
    limit: Option<i16>,
) -> Result<Vec<WorkoutEntry>, serde_json::Value> {
    // If a limit is provided, use it. Else provide the latest 1000
    limit.unwrap_or(1000_i16);

    let wrap_data = sqlx::query("SELECT * FROM workout WHERE user = ? LIMIT ?")
        .bind(user)
        .bind(limit)
        .fetch_all(conn);
    match wrap_data.await {
        Ok(wrap_data) => {
            let mut workouts: Vec<WorkoutEntry> = Vec::new();
            for row in wrap_data {
                let str: &str = row.get("data");
                let json: serde_json::Value = serde_json::from_str(str).unwrap();
                let w = WorkoutEntry::from_json(&json.to_string());
                workouts.push(w);
            }
            // Sort workouts in descending order (latest to oldest workout)
            workouts.sort_unstable_by(|a, b| b.start_time.cmp(&a.start_time));
            Ok(workouts)
        }
        // If workout doesn't exist, 404.
        Err(_) => Err(serde_json::from_str("{\"statusText\": \"No workouts found!\"}").unwrap()),
    }
}
