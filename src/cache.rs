use std::time::UNIX_EPOCH;

use chrono::{DateTime, Utc};
use rocket::{fs::NamedFile, response, response::Responder, response::Response};

use crate::exercises::WorkoutEntry;

/// Caching for static files
/// <https://github.com/SergioBenitez/Rocket/issues/95>
pub struct CachedFile {
    pub data: NamedFile,
    // Time, in seconds, to cache the file
    pub cache_time: u32,
}
impl<'r, 'o: 'r> Responder<'r, 'o> for CachedFile {
    fn respond_to(self, req: &'r rocket::Request<'_>) -> response::Result<'o> {
        let file = self.data;
        let lastmodified = futures::executor::block_on(file.file().metadata())
            .unwrap()
            .modified()
            .ok()
            .unwrap();
        // Build base64 for etag
        let etag: String = base64::encode(
            lastmodified
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs()
                .to_string()
                .as_bytes(),
        );
        // <day-name>, <day> <month> <year> <hour>:<minute>:<second> GMT
        let lastmodified: DateTime<Utc> = lastmodified.into();
        let lastmodified = lastmodified.format("%a, %d %b %Y %H:%M:%S GMT").to_string();
        Response::build_from(file.respond_to(req)?)
            .raw_header("Cache-control", "max-age=86400") //  24h
            .raw_header("Last-Modified", lastmodified)
            .raw_header("ETag", etag)
            .ok()
    }
}

impl CachedFile {
    pub async fn new(data: NamedFile, mut cache_time: u32) -> CachedFile {
        if !crate::PROD {
            cache_time = 0;
        }
        CachedFile {
            data,
            cache_time,
        }
    }
}

/// Caching for `WorkoutEntry`
pub struct WorkoutEntryCache {
    pub data: WorkoutEntry,
    pub json: serde_json::Value,
}
impl<'r, 'o: 'r> Responder<'r, 'o> for WorkoutEntryCache {
    fn respond_to(self, req: &'r rocket::Request<'_>) -> response::Result<'o> {
        // Build base64 for etag
        let etag: String = base64::encode(self.data.uuid);
        Response::build_from(self.json.respond_to(req)?)
            .raw_header("ETag", etag)
            .raw_header("Cache-Control", "private max-age=86400")
            .ok()
    }
}

/// Caching for basic json api responses
pub struct JsonCache {
    pub data: serde_json::Value,
    pub cache_control: String,
}

impl<'r, 'o: 'r> Responder<'r, 'o> for JsonCache {
    fn respond_to(self, req: &'r rocket::Request<'_>) -> response::Result<'o> {
        Response::build_from(self.data.respond_to(req)?)
            .raw_header("Cache-Control", self.cache_control)
            .ok()
    }
}
