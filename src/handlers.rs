use rocket::{fs::NamedFile, response::content};
use rocket_db_pools::Connection;
use rocket_dyn_templates::{context, Template};

#[allow(unused_imports)]
use crate::database::{Db, WorkoutID};
use crate::{exercises::WorkoutEntry, util::timestamp_to_iso8601};

#[get("/workouts/<id>/json")]
pub async fn workout_json(
    id: String,
    mut db: Connection<Db>,
) -> Result<serde_json::Value, serde_json::Value> {
    // Query the database via ID, return data column
    let wrap_data = sqlx::query!("SELECT * FROM workout WHERE id = ?", id).fetch_one(&mut *db);

    // If workout doesn't exist, 404.
    match wrap_data.await {
        Ok(wrap_data) => {
            return Ok(serde_json::Value::String(wrap_data.data.unwrap()));
        }
        Err(_) => {
            return Err(serde_json::from_str("{\"error\": \"Workout not found!\"}").unwrap());
        }
    }
    // If workout exists in database, return it
    // Fun fact: I spent multiple hours trying to remove the "std::option::Option<String>" from the String. (reading docs is really helpful, kids.)
}

#[get("/workouts/<id>/view")]
pub async fn view(
    id: String,
    mut db: Connection<Db>,
) -> Result<rocket_dyn_templates::Template, content::RawHtml<&'static str>> {
    let data: String;

    // Query the database via ID, return data column
    let wrap_data = sqlx::query!("SELECT * FROM workout WHERE id = ?", id).fetch_one(&mut *db);

    // If workout doesn't exist, 404.
    match wrap_data.await {
        Ok(wrap_data) => {
            data = wrap_data.data.unwrap();
        }
        Err(_) => return Err(content::RawHtml(r#"<p>Workout not found!</p>"#)),
    }

    // inline most of this unless it's complex once working
    let entry = WorkoutEntry::from_json(&data);
    // Get date and time
    let workout_start = timestamp_to_iso8601(entry.start_time);
    let workout_duration = crate::util::human_duration(entry.start_time, entry.end_time);
    let comments_not_empty = !&entry.comments.is_empty();
    Ok(Template::render(
        "view",
        context! {
            workout_start: workout_start,
            workout_duration: workout_duration,
            // Workout items
            workout_data: &entry,
            sets: &entry.exercises,
            // Hide comments section if empty
            comments_not_empty: comments_not_empty,
        },
    ))
}

#[get("/static/<file>")]
pub async fn static_file(file: String) -> Option<NamedFile> {
    NamedFile::open(format!("static/{}", file)).await.ok()
}

#[get("/shutdown")]
pub async fn shutdown(shutdown: rocket::Shutdown) -> &'static str {
    shutdown.notify();
    "Shutting down..."
}

#[catch(404)]
fn general_not_found() -> content::RawHtml<&'static str> {
    content::RawHtml(
        r#"
        <p>404</p>
    "#,
    )
}

#[catch(404)]
pub fn workout_404() -> content::RawHtml<&'static str> {
    content::RawHtml(
        r#"
        <p>Uh oh! Looks like our server had a hiccup..</p>
    "#,
    )
}
