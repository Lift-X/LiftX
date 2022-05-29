use rocket::post;
use rocket::{response::Redirect, State};
use rocket_auth::{Auth, Error, Signup, User};
use rocket_db_pools::Connection;
use serde_json::json;
use sqlx::{Row, SqlitePool};
use uuid::Uuid;

use crate::cache::WorkoutEntryCache;
use crate::database::{get_exercises, get_workouts};
use crate::error::WlrsError;
use crate::{database::Db, exercises::WorkoutEntry};

#[get("/workouts/<id>/json")]
pub async fn workout_json(
    id: String,
    mut db: Connection<Db>,
    user: Option<User>,
) -> Result<WorkoutEntryCache, serde_json::Value> {
    match user {
        Some(user) => {
            // Query the database via ID, return data column
            let wrap_data = sqlx::query("SELECT * FROM workout WHERE id = ? AND user = ?")
                .bind(id)
                .bind(user.name())
                .fetch_one(&mut *db);
            // If workout doesn't exist, 404.
            match wrap_data.await {
                Ok(wrap_data) => {
                    let data: WorkoutEntry;
                    let json: serde_json::Value;
                    {
                        let str: &str = wrap_data.try_get("data").unwrap();
                        data = WorkoutEntry::from_json(str);
                        json = json!(data);
                    }
                    let result = WorkoutEntryCache { data, json };
                    Ok(result)
                }
                Err(_) => Err(serde_json::json!({
                    "error": WlrsError::WLRS_ERROR_NOT_FOUND
                })),
            }
        }
        None => Err(serde_json::json!({ "error": "You must be logged in to view this workout" })),
    }
}

#[get("/workouts/<id>/delete")]
pub async fn workout_delete(
    id: String,
    mut db: Connection<Db>,
    user: Option<User>,
) -> Result<serde_json::Value, serde_json::Value> {
    match user {
        Some(user) => {
            // Query the database via ID, delete
            let query = sqlx::query("DELETE FROM workout WHERE id = ? AND user = ?")
                .bind(id)
                .bind(user.name())
                .fetch_one(&mut *db);
            match query.await {
                Ok(_) => Ok(serde_json::json!({ "success": "Workout deleted" })),
                Err(_) => Err(serde_json::json!({
                    "error": WlrsError::WLRS_ERROR_NOT_FOUND
                })),
            }
        }
        None => Err(serde_json::json!({
            "error": WlrsError::WLRS_ERROR_NOT_LOGGED_IN
        })),
    }
}

#[post("/workouts/json", format = "json", data = "<data>")]
pub async fn post_workout_json(
    data: rocket::serde::json::Json<WorkoutEntry>,
    conn: &State<SqlitePool>,
) -> rocket::response::Redirect {
    // "Unwrap" Json<WorkoutEntry> to WorkoutEntry
    let val: WorkoutEntry = data.into_inner();
    // Generate UUID
    let uuid: Uuid = Uuid::new_v4();
    debug!("Creating workoutentry with {}", uuid);
    crate::database::insert_workout(uuid, val, &**conn).await;
    rocket::response::Redirect::to(format!("/workouts/{}", uuid))
}

#[post("/register", data = "<form>")]
pub async fn post_register(
    form: rocket::form::Form<Signup>,
    auth: Auth<'_>,
) -> Result<Redirect, Error> {
    let form_proc = &form.into_inner();
    auth.signup(&form_proc.clone()).await.unwrap();
    auth.login(&form_proc.into()).await.unwrap();
    println!("Signed up!");
    Ok(Redirect::to("/home"))
}

#[post("/login", data = "<form>")]
pub async fn post_login(
    form: rocket::form::Form<Signup>,
    auth: Auth<'_>,
) -> Result<Redirect, Error> {
    let result = auth.login(&form.into_inner().into()).await;
    match result {
        Ok(_) => Ok(Redirect::to("/home")),
        Err(e) => Err(e),
    }
}

#[get("/user/current")]
pub fn get_current_user(user: Option<User>) -> Result<serde_json::Value, serde_json::Value> {
    match user {
        Some(user) => Ok(serde_json::json!({ "name": user.name() })),
        None => Err(serde_json::json!({
            "error": WlrsError::WLRS_ERROR_NOT_LOGGED_IN
        })),
    }
}

#[get("/user/workouts")]
pub async fn get_user_workouts(
    user: Option<User>,
    conn: &State<SqlitePool>,
) -> Result<serde_json::Value, serde_json::Value> {
    match user {
        Some(user) => {
            let workouts = get_workouts(conn, user.name().to_string(), None, None).await;
            match workouts {
                Ok(workouts) => Ok(serde_json::json!({ "workouts": workouts })),
                Err(workouts) => Err(workouts),
            }
        }
        None => Err(serde_json::json!({
            "error": WlrsError::WLRS_ERROR_NOT_LOGGED_IN
        })),
    }
}

#[get("/user/workouts/<limit>")]
pub async fn get_user_workouts_dynamic(
    user: Option<User>,
    conn: &State<SqlitePool>,
    limit: usize,
) -> Result<serde_json::Value, serde_json::Value> {
    match user {
        Some(user) => {
            let workouts =
                get_workouts(conn, user.name().to_string(), Some(limit as i16), None).await;
            match workouts {
                Ok(workouts) => Ok(serde_json::json!({ "workouts": workouts })),
                Err(workouts) => Err(workouts),
            }
        }
        None => Err(serde_json::json!({
            "error": WlrsError::WLRS_ERROR_NOT_LOGGED_IN
        })),
    }
}

#[get("/user/workouts/recent/<days>")]
pub async fn get_user_workouts_recent(
    user: Option<User>,
    conn: &State<SqlitePool>,
    days: usize,
) -> Result<serde_json::Value, serde_json::Value> {
    match user {
        Some(user) => {
            let workouts =
                get_workouts(conn, user.name().to_string(), None, Some(days as u64)).await;
            match workouts {
                Ok(workouts) => Ok(serde_json::json!({ "workouts": workouts })),
                Err(workouts) => Err(workouts),
            }
        }
        None => Err(serde_json::json!({
            "error": WlrsError::WLRS_ERROR_NOT_LOGGED_IN
        })),
    }
}

#[get("/user/exercises/list")]
pub async fn get_exercises_list(
    user: Option<User>,
    conn: &State<SqlitePool>,
) -> Result<serde_json::Value, serde_json::Value> {
    match user {
        Some(user) => {
            let exercises = get_exercises(conn, user.name().to_string()).await;
            match exercises {
                Ok(exercises) => Ok(serde_json::json!({ "exercises": exercises })),
                Err(exercises) => Err(exercises),
            }
        }
        None => Err(serde_json::json!({
            "error": WlrsError::WLRS_ERROR_NOT_LOGGED_IN
        })),
    }
}
