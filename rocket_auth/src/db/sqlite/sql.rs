pub(crate) const CREATE_TABLE: &str = "
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE,
    password TEXT NOT NULL,
    is_admin BOOL DEFAULT 0
    -- failed_login_attempts INTEGER DEFAULT 0

);";

pub(crate) const INSERT_USER: &str = "
INSERT INTO users (name, password, is_admin) VALUES (?1, ?2, ?3);
";

pub(crate) const UPDATE_USER: &str = "
UPDATE table SET
    name = ?2,
    password = ?3,
    is_admin = ?4,
WHERE
    id = ?1;
";

pub(crate) const SELECT_BY_ID: &str = "
SELECT * FROM users WHERE id = ?1;
";

pub(crate) const SELECT_BY_NAME: &str = "
SELECT * FROM users WHERE name = ?1;
";

pub(crate) const REMOVE_BY_ID: &str = "
DELETE FROM users WHERE id =?1;
";
pub(crate) const REMOVE_BY_NAME: &str = "
DELETE FROM users WHERE name =?1;
";
