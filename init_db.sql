CREATE TABLE user (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name    TEXT    NOT NULL,
    email   TEXT    NOT NULL UNIQUE,
    pwd     TEXT    NOT NULL
);
CREATE INDEX user_id_idx ON user (user_id);
CREATE INDEX user_email_idx ON user (email);
CREATE TABLE account (
    acc_id INTEGER PRIMARY KEY AUTOINCREMENT,
    balance REAL
);
CREATE INDEX acc_id_idx ON account (acc_id);
CREATE TABLE useraccount (
    user_id INTEGER,
    acc_id  INTEGER,
    FOREIGN KEY (user_id) REFERENCES user(user_id),
    FOREIGN KEY (acc_id) REFERENCES account(acc_id),
    UNIQUE (user_id, acc_id)
);
CREATE INDEX usracc_user_idx ON useraccount (user_id);
CREATE INDEX usracc_acc_idx ON useraccount (acc_id);
CREATE INDEX usracc_useracc_idx ON useraccount (user_id, acc_id);
