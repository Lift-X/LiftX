//use std::collections::HashMap;

use rocket::post;
use rocket::{response::Redirect, State};
use rocket_auth::{Auth, Error, Signup, User};
use rocket_db_pools::Connection;
use sqlx::{Row, SqlitePool};
use uuid::Uuid;

use crate::database::get_workouts;
use crate::error;
//use crate::equipment::Weight;
//use crate::exercises::{GraphEntry, GraphItem};
use crate::{database::Db, exercises::WorkoutEntry};

#[get("/workouts/<id>/json")]
pub async fn workout_json(
    id: String,
    mut db: Connection<Db>,
    user: Option<User>,
) -> Result<serde_json::Value, serde_json::Value> {
    match user {
        Some(user) => {
            // Query the database via ID, return data column
            //let wrap_data = sqlx::query!("SELECT * FROM workout WHERE id = ?", id).fetch_one(&mut *db);
            let wrap_data = sqlx::query("SELECT * FROM workout WHERE id = ? AND user = ?")
                .bind(id)
                .bind(user.name())
                .fetch_one(&mut *db);
            // If workout doesn't exist, 404.
            match wrap_data.await {
                Ok(wrap_data) => {
                    let str: &str = wrap_data.try_get("data").unwrap();
                    Ok(serde_json::from_str(str).unwrap())
                }
                Err(_) => Err(serde_json::from_str("{\"error\": \"Workout not found!\"}").unwrap()),
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
            // Query the database via ID, return data column
            //let wrap_data = sqlx::query!("SELECT * FROM workout WHERE id = ?", id).fetch_one(&mut *db);
            sqlx::query("DELETE FROM workout WHERE id = ? AND user = ?")
                .bind(id)
                .bind(user.name())
                .fetch_one(&mut *db).await.unwrap();
                return Ok(serde_json::from_str("{\"success\": \"Workout deleted or not found!\"}").unwrap())
        }
        None => Err(serde_json::json!({ "error": "You must be logged in to delete a workout" })),
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
    let uuid = Uuid::new_v4();
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
    auth.login(&form.into_inner().into()).await.unwrap();
    println!("Logged in!");
    Ok(Redirect::to("/home"))
}

#[get("/user/current")]
pub fn get_current_user(user: Option<User>) -> Result<serde_json::Value, serde_json::Value> {
    match user {
        Some(user) => Ok(serde_json::json!({ "name": user.name() })),
        None => Err(serde_json::json!({ "error": error::WLRS_ERROR_NOT_LOGGED_IN })),
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
        None => Err(serde_json::json!({ "error": error::WLRS_ERROR_NOT_LOGGED_IN })),
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
        None => Err(serde_json::json!({ "error": error::WLRS_ERROR_NOT_LOGGED_IN })),
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
        None => Err(serde_json::json!({ "error": error::WLRS_ERROR_NOT_LOGGED_IN })),
    }
}














// Hard code day amount until working implementation
/* yes this is awful, don't even look at it.
#[get("/user/graphs/workouts/30")]
pub async fn get_user_wrokouts_graph(
    user: Option<User>,
    conn: &State<SqlitePool>,
) -> Result<serde_json::Value, serde_json::Value> {
    match user {
        Some(user) => {
            // Get 30 days worth of workouts
            let workouts: Vec<WorkoutEntry> = serde_json::from_value(
                get_user_workouts_recent(Some(user), conn, 30)
                    .await
                    .unwrap(),
            )
            .unwrap();

            // Build Graph
            let mut graph: Vec<GraphEntry> = Vec::new();
            // Build hashmap of exercises
            let mut exercises_map: HashMap<String, Vec<GraphItem>> = HashMap::new();
            for workout in &workouts {
                // Create a NaiveDateTime from the timestamp
                let naive = chrono::NaiveDateTime::from_timestamp(
                    workout.start_time.try_into().unwrap(),
                    0,
                );

                // Create a normal DateTime from the NaiveDateTime
                let datetime: chrono::DateTime<chrono::Utc> =
                chrono::DateTime::from_utc(naive, chrono::Utc);

                // Format the datetime how you want
                let newdate = datetime.format("%Y-%m-%d");

                // Build list of exercises
                for exercise in &workout.exercises {
                    if exercises_map.contains_key(&exercise.exercise) {
                        let mut max_weight : Weight = Weight {
                            weight: 0.0,
                            // TODO: Account for different units
                            weight_unit: "lbs".to_string(),
                        };
                        for set in &exercise.sets {
                            if set.weight.weight > max_weight.weight {
                                max_weight = set.weight.clone();
                            }
                        }
                        // Update value in hashmap
                        let vec = exercises_map.get_mut(&exercise.exercise).unwrap();
                        vec.push(GraphItem {
                            date: newdate.to_string(),
                            weight: max_weight,
                        });
                    } else {
                        let mut list: Vec<GraphItem> = Vec::new();
                        let mut max_weight : Weight = Weight {
                            weight: 0.0,
                            // TODO: Account for different units
                            weight_unit: "lbs".to_string(),
                        };
                        // get the max weight out of the sets
                        for set in &exercise.sets {
                            if set.weight.weight > max_weight.weight {
                                max_weight = set.weight.clone();
                            }
                        }
                        list.push(GraphItem {date:newdate.to_string(), weight: max_weight });
                        exercises_map.insert(exercise.exercise.clone(), list);
                    }
                }
            }

            // Only use the top 5 exercises
            let mut exercises_vec: Vec<String> = Vec::new();
            for (exercise, _) in exercises_map.iter().take(5) {
                exercises_vec.push(exercise.clone());
            }

            // Build graph
            for exercise in exercises_vec {
                let mut count = 0;
                for workout in &workouts {
                    for ex in &workout.exercises {
                        if ex.exercise.to_lowercase() == exercise {
                            count += 1;
                        }
                    }
                }
                //graph.push(GraphEntry {date:newdate.to_string(),exercise:exercise,  });
            }


            Ok((serde_json::json!({ "workouts": "Joe" })))
        }
        None => Err(serde_json::json!({ "error": "You must be logged in to view workouts!" })),
    }
}
*/
