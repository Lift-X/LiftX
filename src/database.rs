use crate::error::WlrsError;
use crate::exercises::WorkoutEntry;
use crate::{exercises::ExerciseList};
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

/// Get all workouts (for a certain user) from the database.
/// Optionally provide a max number of workouts to return
pub async fn get_workouts(
    conn: &SqlitePool,
    user: String,
    mut limit: Option<i16>,
    recent_days: Option<u64>,
) -> Result<Vec<WorkoutEntry>, serde_json::Value> {
    // If a limit is provided, use it. Else provide the latest 1000 workouts
    if limit.is_none() {
        limit = Some(1000)
    }

    // fyi: Cannot take `recent_days` as a SQL query, as the `created` column is not the start of the workout
    let wrap_data =
        sqlx::query("SELECT * FROM workout WHERE user = ? ORDER BY created DESC LIMIT ?")
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
                // TODO: Might be expensive if we have a lot of workouts, perhaps move  the match statement up a level.
                match recent_days {
                    Some(days) => {
                        if w.start_time
                            > std::time::UNIX_EPOCH.elapsed().unwrap().as_secs() - (days * 86400)
                        {
                            workouts.push(w);
                        }
                    }
                    None => workouts.push(w),
                }
            }
            // Sort workouts in descending order (latest to oldest workout)
            workouts.sort_unstable_by(|a, b| b.start_time.cmp(&a.start_time));
            Ok(workouts)
        }
        // If workout doesn't exist, 404.
        Err(_) => Err(serde_json::json!({ "error": WlrsError::WLRS_ERROR_NOT_FOUND })),
    }
}

/// Build a list of exercises a user has done.
/// This returns a hashmap with the key as the exercise name and the value as the number of times the user has done that exercise.
pub async fn get_exercises(
    conn: &SqlitePool,
    user: String,
) -> Result<Vec<ExerciseList>, serde_json::Value> {
    let wrap_data = sqlx::query("SELECT * FROM workout WHERE user = ?")
        .bind(user)
        .fetch_all(conn);

    match wrap_data.await {
        Ok(wrap_data) => {
            let mut exercises_list: Vec<ExerciseList> = Vec::new();
            {
                for row in wrap_data {
                    let str: &str = row.get("data");
                    let json: serde_json::Value = serde_json::from_str(str).unwrap();
                    let w = WorkoutEntry::from_json(&json.to_string());
                    /*for exercise in w.exercises {
                        let count = exercises_list.entry(exercise.exercise).or_insert(0);
                        *count += 1;
                    }*/
                    for exercise in w.exercises {
                        // convert exercise name to kebab case
                        let exercise_name = crate::util::string_capital_case(&exercise.exercise);
                        let count: Option<&mut ExerciseList> =
                            exercises_list.iter_mut().find(|x| x.name == exercise_name);
                        match count {
                            Some(count) => {
                                count.count += 1;
                            }
                            None => {
                                let new_exercise = ExerciseList {
                                    name: exercise_name,
                                    count: 1,
                                };
                                exercises_list.push(new_exercise);
                            }
                        }
                    }
                }
            }
            exercises_list.sort_unstable_by(|a, b| b.count.cmp(&a.count));
            Ok(exercises_list)
        }
        Err(_) => Err(serde_json::json!({ "error": WlrsError::WLRS_ERROR_NOT_FOUND })),
    }
}
