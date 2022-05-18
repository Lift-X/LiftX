use rocket::fs::NamedFile;

#[allow(unused_imports)]
use crate::database::{Db, WorkoutID};

#[get("/workouts/<id>")]
pub async fn workout_view(id: String) -> Option<NamedFile> {
    println!("Viewing {}", id);
    NamedFile::open("templates/basic.html").await.ok()
}

#[get("/workouts/new")]
pub async fn workout_new() -> Option<NamedFile> {
    NamedFile::open("templates/basic.html").await.ok()
}

#[get("/public/<file..>")]
pub async fn static_file(file: std::path::PathBuf) -> Option<NamedFile> {
    //NamedFile::open(format!("public/{}", file)).await.ok()
    let file = std::path::Path::new("public").join(file);

    NamedFile::open(file).await.ok()
}

#[get("/")]
pub async fn home() -> Option<NamedFile> {
    NamedFile::open("templates/basic.html").await.ok()
}

#[get("/shutdown")]
pub async fn shutdown(shutdown: rocket::Shutdown) -> &'static str {
    shutdown.notify();
    "Shutting down..."
}

#[catch(404)]
pub async fn general_404() -> Option<NamedFile> {
    NamedFile::open("templates/basic.html").await.ok()
}