CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name    TEXT    NOT NULL,
    last_name   TEXT    NOT NULL,
    address   TEXT    NOT NULL,
    pwd_hash     TEXT    NOT NULL,
    UNIQUE (first_name, last_name)
);
CREATE INDEX user_id_idx ON users (user_id);
CREATE TABLE accounts (
    acc_id INTEGER PRIMARY KEY AUTOINCREMENT,
    balance REAL
);
CREATE INDEX acc_id_idx ON accounts (acc_id);
CREATE TABLE useraccounts (
    user_id INTEGER,
    acc_id  INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (acc_id) REFERENCES accounts(acc_id),
    UNIQUE (user_id, acc_id)
);
CREATE INDEX usracc_user_idx ON useraccounts (user_id);
CREATE INDEX usracc_acc_idx ON useraccounts (acc_id);
CREATE INDEX usracc_useracc_idx ON useraccounts (user_id, acc_id);
