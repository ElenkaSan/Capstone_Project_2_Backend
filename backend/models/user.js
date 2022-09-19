"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");

/** Related functions for users. */

class User {
  /** authenticate user with username, password.
   *
   * Returns { username, first_name, last_name, email, is_admin }
   *
   * Throws UnauthorizedError is user not found or wrong password.
   **/

  static async authenticate(username, password) {
    // try to find the user first
    const result = await db.query(
          `SELECT username,
                  password,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  notes,
                  is_admin AS "isAdmin"    
           FROM users
           WHERE username = $1`,
        [username],
    );

    const user = result.rows[0];

    if (user) {
      // compare hashed password to a new hash from password
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid === true) {
        delete user.password;
        return user;
      }
    }

    throw new UnauthorizedError("Invalid username/password");
  }

  /** Register user with data.
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws BadRequestError on duplicates.
   **/

  static async register(
      { username, password, firstName, lastName, email, notes, isAdmin }) {
    const duplicateCheck = await db.query(
          `SELECT username
           FROM users
           WHERE username = $1`,
        [username],
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate username: ${username}`);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
          `INSERT INTO users
           (username,
            password,
            first_name,
            last_name,
            email,
            notes,
            is_admin)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING username, 
                     first_name AS "firstName", 
                     last_name AS "lastName", 
                     email, 
                     notes,
                     is_admin AS "isAdmin"`,
        [
          username,
          hashedPassword,
          firstName,
          lastName,
          email,
          notes,
          isAdmin,
        ],
    );

    const user = result.rows[0];

    return user;
  }

  /** Find all users.
   *
   * Returns [{ username, first_name, last_name, email, is_admin }, ...]
   **/

  static async findAll() {
    const result = await db.query(
          `SELECT username,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  notes,
                  is_admin AS "isAdmin"
           FROM users
           ORDER BY username`,
    );

    return result.rows;
  }

  /** Given a username, return data about user.
   *
   * Returns { username, first_name, last_name, is_admin, jobs }
   *   where jobs is { id, title, company_handle, company_name, state }
   *
   * Throws NotFoundError if user not found.
   **/

  static async get(username) {
    const userRes = await db.query(
          `SELECT username,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  notes,
                  is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
        [username],
    );

    const user = userRes.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    // const userTripRes = await db.query(
    //       `SELECT t.username
    //        FROM trips AS t
    //        WHERE t.username = $1`, [username]);

    // user.trips = userTripRes.rows.map(t => t.username_id);

    const userTripRes = await db.query(
      `SELECT t.flightReservation_id AS "flightId", t.hotelReservation_id AS "hotelId"
       FROM trips AS t
       WHERE t.username = $1`, [username]);

    user.trips = userTripRes.rows.map(t => t.flightReservation_id && t.hotelReservation_id);
    return user;
    // const userFlightTripRes = await db.query(
    //       `SELECT t.flightReservation_id AS "flightId"
    //        FROM trips AS t
    //        WHERE t.username = $1`, [username]);

    // user.trips = userFlightTripRes.rows.map(t => t.flightReservation_id);
    // user.trips = userFlightTripRes.rows.map(t => t.flightId);

    // const userHotelTripRes = await db.query(
    //       `SELECT t.hotelReservation_id AS "hotelId"
    //        FROM trips AS t
    //        WHERE t.username = $1`, [username]);

    // user.trips = userHotelTripRes.rows.map(t => t.hotelReservation_id);
    // user.trips = userHotelTripRes.rows.map(t => t.hotelId);

    // const userCarTripRes = await db.query(
    //       `SELECT carRental_id AS "carId"
    //        FROM trips AS t
    //        WHERE t.username = $1`, [username]);

    // user.trips = userCarTripRes.rows.map(t => t.carRental_id);
    // user.trips = userCarTripRes.rows.map(t => t.carId);
    // return user;
  }

  /** Update user data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include:
   *   { firstName, lastName, password, email, isAdmin, note }
   *
   * Returns { username, firstName, lastName, email, isAdmin, note }
   *
   * Throws NotFoundError if not found.
   *
   * WARNING: this function can set a new password or make a user an admin.
   * Callers of this function must be certain they have validated inputs to this
   * or a serious security risks are opened.
   */

  static async update(username, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    }

    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          firstName: "first_name",
          lastName: "last_name",
          isAdmin: "is_admin",
        });
    const usernameVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE users 
                      SET ${setCols} 
                      WHERE username = ${usernameVarIdx} 
                      RETURNING username,
                                first_name AS "firstName",
                                last_name AS "lastName",
                                email,
                                is_admin AS "isAdmin",
                                notes`
    const result = await db.query(querySql, [...values, username]);
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    delete user.password;
    return user;
  }

  /** Delete given user from database; returns undefined. */

  static async remove(username) {
    let result = await db.query(
          `DELETE
           FROM users
           WHERE username = $1
           RETURNING username`,
        [username],
    );
    const user = result.rows[0];
    if (!user) throw new NotFoundError(`No user: ${username}`);
  }

  // Add / remove Flight 
  static async addingFlight(username, flightId) {
    const preCheck = await db.query(
          `SELECT id
           FROM flightReservations
           WHERE id = $1`, [flightId]);
    const flight = preCheck.rows[0];
    if (!flight) throw new NotFoundError(`No flight: ${flightId}`);

    const preCheck2 = await db.query(
      `SELECT username
       FROM users
       WHERE username = $1`, [username]);
  const user = preCheck2.rows[0];
  if (!user) throw new NotFoundError(`No username: ${username}`);

    await db.query(
          `INSERT INTO trips (flightReservation_id, username)
          VALUES ($1, $2)`,
          [flightId, username]);
  }

  static async removeFlight(username, flightId) {
    const preCheck = await db.query(
        `SELECT id
         FROM flightReservations
         WHERE id = $1`, [flightId]);
    const flight = preCheck.rows[0];
    if (!flight) throw new NotFoundError(`No flight: ${flightId}`);

    const preCheck2 = await db.query(
        `SELECT username
         FROM users
         WHERE username = $1`, [username]);
    const user = preCheck2.rows[0];
    if (!user) throw new NotFoundError(`No username: ${username}`);

    const preCheck3 = await db.query(
        `SELECT username, flightReservation_id 
         FROM trips
         WHERE username = $1 and 
               flightReservation_id = $2`, [username, flightId]);
    const trips = preCheck3.rows[0];
    if (!trips) throw new NotFoundError(`No trips with flight found: ${username}, ${flightId}`);

    await db.query(
        `DELETE FROM trips 
         WHERE username = $1 and 
               flightReservation_id = $2`, [username, flightId]);
    return true;
  }

  // Add / remove hotel
  static async addingHotel(username, hotelId) {
    const preCheck = await db.query(
          `SELECT id
           FROM hotelReservations
           WHERE id = $1`, [hotelId]);
    const hotel = preCheck.rows[0];
    if (!hotel) throw new NotFoundError(`No hotel: ${hotelId}`);

    const preCheck2 = await db.query(
      `SELECT username
       FROM users
       WHERE username = $1`, [username]);
  const user = preCheck2.rows[0];
  if (!user) throw new NotFoundError(`No username: ${username}`);

    await db.query(
          `INSERT INTO trips (hotelReservation_id, username)
          VALUES ($1, $2)`,
          [hotelId, username]);
  }

  static async removeHotel(username, hotelId) {
    const preCheck = await db.query(
        `SELECT id
         FROM hotelReservations
         WHERE id = $1`, [hotelId]);
    const hotel = preCheck.rows[0];
    if (!hotel) throw new NotFoundError(`No hotel: ${hotelId}`);

    const preCheck2 = await db.query(
        `SELECT username
         FROM users
         WHERE username = $1`, [username]);
    const user = preCheck2.rows[0];
    if (!user) throw new NotFoundError(`No username: ${username}`);

    const preCheck3 = await db.query(
        `SELECT username, hotelReservation_id
         FROM trips
         WHERE username = $1 and 
               hotelReservation_id = $2`, [username, hotelId]);
    const trips = preCheck3.rows[0];
    if (!trips) throw new NotFoundError(`No trips with hotel found: ${username}, ${hotelId}`);

    await db.query(
        `DELETE FROM trips 
         WHERE username = $1 and 
               hotelReservation_id = $2`, [username, hotelId]);
    return true;
  }
  
}


module.exports = User;
