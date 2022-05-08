#![forbid(unsafe_code)]
#[macro_use]
extern crate rocket;

pub mod database;
pub mod equipment;
mod exercises;
pub mod handlers;
pub mod muscles;
#[cfg(test)]
mod tests;

use equipment::WeightType;
use exercises::{ExerciseEntry, SetEntry, WorkoutEntry, EXERCISE_BENCH_PRESS};
use rocket_db_pools::Database;
use sqlx::{ConnectOptions, SqliteConnection};

#[allow(unused_imports)]
use crate::{database::create_connection, equipment::Weight};

// Global Preference for weight, implement configuration later
const GLOBAL_WEIGHT_UNIT: WeightType = equipment::POUNDS;

//#[tokio::main]
#[rocket::main]
async fn main() {
    // connect to DB
    let conn =
        <sqlx::sqlite::SqliteConnectOptions as std::str::FromStr>::from_str("sqlite://data.db")
            .unwrap()
            .create_if_missing(true)
            .connect()
            .await
            .unwrap();

    //database::build_tables(conn).await;
    dev(conn).await;
    let rocket = launch_web().await;
}

async fn launch_web() -> Result<(), rocket::Error> {
    // launch web server
    let shield = rocket::shield::Shield::default()
        .enable(rocket::shield::Referrer::NoReferrer)
        .enable(rocket::shield::XssFilter::EnableBlock);
    let rocket = rocket::build()
        .attach(shield)
        .attach(database::Db::init())
        .attach(rocket_dyn_templates::Template::fairing())
        .mount("/", routes![crate::handlers::workout_json]);
    rocket.launch().await
}

// Stuff not needed for prod, but useful for testing
async fn dev(mut conn: SqliteConnection) {
    let bench_press = SetEntry {
        exercise: *EXERCISE_BENCH_PRESS,
        reps: 8,
        weight: Weight {
            weight: 135.0,
            weight_unit: "lbs".to_string(),
        },
        reps_in_reserve: 1.5,
    };
    let mut bench_set = ExerciseEntry {
        exercise: *EXERCISE_BENCH_PRESS,
        comments: String::from(""),
        sets: vec![bench_press.clone()],
    };
    for i in 0..2 {
        bench_set.sets.push(bench_press.clone());
    }
    let bench_workout = WorkoutEntry {
        start_time: std::time::UNIX_EPOCH.elapsed().unwrap().as_secs(),
        end_time: std::time::UNIX_EPOCH.elapsed().unwrap().as_secs() + 3600,
        exercises: vec![bench_set.clone()],
        comments: "".to_string(),
        user: "John Doe".to_string(),
    };
    //database::insert_workout(bench_workout, conn).await;
    //http://localhost:8000/workout/3293d876-d823-457e-9cec-b1df68de37cf/json
}
