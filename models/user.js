/** User class for message.ly */
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");
const db = require("../db");
const ExpressError = require("../expressError");


/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const user = await db.query(`INSERT INTO users
    (username, password, first_name, last_name, phone, join_at, last_login_at)
    VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
    RETURNING username, password, first_name, last_name, phone`,
    [username, hashedPassword, first_name, last_name, phone]);
    return user.rows[0]
   }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    let pw = await db.query(`SELECT password
    FROM users WHERE username=$1`,
    [username]);
    pw = pw.rows[0];
    if (!pw){
      throw new ExpressError("Invalid credentials", 400)
    }
    return bcrypt.compare(password, pw.password)
   }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(`UPDATE users
      SET last_login_at=current_timestamp
      WHERE username=$1
      RETURNING username`, [username])
    if (!result.rows[0]){
      throw new ExpressError('User not found')
    }
   }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const users = await db.query(`SELECT
      username, first_name, last_name, phone
      FROM users`);
    return users.rows
   }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const user = await db.query(`SELECT
      username, frist_name, last_name, phone, join_at, last_login_at
      FROM users WHERE username=$1`,
      [username]);
    if (!user.rows[0]){
      throw new ExpressError('User not found')
    }
    return user.rows[0]
   }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const msg = await db.query(`SELECT
      id, to_username, first_name, last_name, phone, body, sent_at, read_at
      FROM messages
      JOIN users ON messages.to_username=users.username
      WHERE from_username=$1`,
      [username]);
    return msg.rows.map(m => ({
      id: m.id, to_user: {username: m.to_username, first_name: m.first_name,
      last_name: m.last_name, phone: m.phone}, body: m.body, sent_at: m.sent_at, read_at: m.read_at
    }));
   }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const msg = await db.query(`SELECT
      id, from_username, first_name, last_name, phone, body, sent_at, read_at
      FROM messages
      JOIN users ON messages.from_username=users.username
      WHERE to_username=$1`,
      [username]);
    return msg.rows.map(m => ({
      id: m.id, from_user: {username: m.from_username, first_name: m.first_name, last_name: m.last_name, phone: m.phone},
      body: m.body, sent_at: m.sent_at, read_at: m.read_at
    }))
   }
}


module.exports = User;