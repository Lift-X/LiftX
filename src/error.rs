use serde::{Deserialize, Serialize};
use std::fmt;

#[allow(non_camel_case_types)]
#[derive(Debug, Serialize, Deserialize)]
pub enum WlrsError {
    WLRS_ERROR_NOT_LOGGED_IN,
    WLRS_ERROR_NOT_FOUND,
    WLRS_ERROR_INVALID_TYPE,
    Custom { message: String },
}

impl fmt::Display for WlrsError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::WLRS_ERROR_NOT_FOUND => f.write_str("Not found!"),
            Self::WLRS_ERROR_NOT_LOGGED_IN => f.write_str("Not logged in!"),
            Self::WLRS_ERROR_INVALID_TYPE => f.write_str("Invalid type found!"),
            Self::Custom { message } => write!(f, "{}", message),
        }
    }
}
