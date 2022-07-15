use rocket::response;
/// Allows for a `Cache-Control` header to be used on any response that implements `Responder`.
/// <https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control>.
/// `cache_control` should be **just** the value of the `Cache-Control` header. "Cache-Control:" should not be included.
pub struct CacheableResponse<T> {
    pub data: T,
    pub cache_control: String,
}

impl<'r, 'o: 'r, T: response::Responder<'r, 'o>> response::Responder<'r, 'o> for CacheableResponse<T> {
    fn respond_to(self, req: &'r rocket::Request<'_>) -> response::Result<'o> {
        response::Response::build_from(self.data.respond_to(req)?)
            .raw_header("Cache-Control", self.cache_control)
            .ok()
    }
}
