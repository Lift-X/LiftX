use rocket::fs::NamedFile;
use rocket_dyn_templates::{context, Template};

#[allow(unused_imports)]
use crate::database::{Db, WorkoutID};

#[get("/workouts/<id>")]
pub async fn workout_view(id: String) -> Option<NamedFile> {
    println!("Viewing {}", id);
    NamedFile::open("templates/view.html").await.ok()
}

#[get("/workouts/new")]
pub async fn workout_new() -> Option<NamedFile> {
    NamedFile::open("templates/new.html").await.ok()
}

#[get("/public/<file..>")]
pub async fn static_file(file: std::path::PathBuf) -> Option<NamedFile> {
    //NamedFile::open(format!("public/{}", file)).await.ok()
    let file = std::path::Path::new("public").join(file);

    NamedFile::open(file).await.ok()
}

#[get("/shutdown")]
pub async fn shutdown(shutdown: rocket::Shutdown) -> &'static str {
    shutdown.notify();
    "Shutting down..."
}

#[catch(404)]
pub fn general_404() -> rocket_dyn_templates::Template {
    Template::render(
        "status",
        context! {
            status_code: "404",
            status_message: "Couldn't find what you're looking for!",
        },
    )
}

#[catch(404)]
pub fn workout_404() -> rocket_dyn_templates::Template {
    Template::render(
        "status",
        context! {
            status_code: "404",
            status_message: "Workout not found!",
        },
    )
}
