use crate::exercises::WorkoutEntry;
use rocket_db_pools::Database;
use sqlx::SqlitePool;

#[derive(Database)]
#[database("sqlite_db")]
pub struct Db(sqlx::sqlite::SqlitePool);

pub async fn create_connection() -> sqlx::SqlitePool {
    let pool = sqlx::SqlitePool::connect("data.db").await.unwrap();
    pool
}

pub async fn build_tables(conn: SqlitePool) {
    // Workout Table
    sqlx::query("CREATE TABLE if not exists workout (id TINYTEXT PRIMARY KEY, created char(12), user TINYTEXT, data MEDIUMTEXT)")
        .execute(&conn)
        .await
        .unwrap();

    // User Table
    let users: rocket_auth::Users = conn.into();
    users.create_table().await.unwrap();
}

pub async fn insert_workout(uuid: uuid::Uuid, exercise: WorkoutEntry, conn: &SqlitePool) {
    debug!("Creating ExerciseEntry with id: {}...", uuid.to_string());
    let query = format!(
        "INSERT INTO workout (id, created, user, data) VALUES ('{}', '{}', '{}', '{}')",
        uuid,
        std::time::UNIX_EPOCH.elapsed().unwrap().as_secs(),
        exercise.user,
        exercise.to_json()
    );
    sqlx::query(&query).execute(conn).await.unwrap();
}
