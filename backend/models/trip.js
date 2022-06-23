"use strict";

const db = require("../db");
const { NotFoundError} = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");


class Trip {
  /** Create a flight (from data), update db, return new flight data.
   **/

  static async create(data) {
    const result = await db.query(
          `INSERT INTO trips (trip_name,
                              trip_date,
                              username,
                              flightReservation_id,
                              hotelReservation_id,
                              carRental_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING
                    id,
                    trip_name AS "tripName",
                    trip_date AS "tripDate",
                    username,
                    flightReservation_id AS "flightId",
                    hotelReservation_id AS "hotelId",
                    carRental_id AS "carId"`,
        [
          data.tripName,
          data.tripData,
          data.username,
          data.flightId,
          data.hotelId,
          data.carId,
        ]);
    let trip = result.rows[0];

    return trip;
  }

  /** Find all flights (optional filter on searchFilters).
   *
   * searchFilters (all optional):
   * - type
   * - classType
   * - location_arrival
   * - date_departure
   * - location_departure
   * -? sort_order
   * */

  static async findAll({ username, flightReservationId, hotelReservationId, carRentalId, tripName } = {}) {
    let query = `SELECT t.id,
                        t.username,
                        t.flightReservation_id AS "flightId",
                        t.hotelReservation_id AS "hotelId", 
                        t.carRental_id AS "carId",
                        t.trip_name AS "tripName"
                 FROM trips t`;
    let whereExpressions = [];
    let queryValues = [];

    // For each possible search term, add to whereExpressions and
    // queryValues so we can generate the right SQL

    if (username !== undefined) {
        queryValues.push(`%${username}%`);
        whereExpressions.push(`username ILIKE $${queryValues.length}`);
      }

    if (flightId !== undefined) {
        queryValues.push(`%${flightId}%`);
        whereExpressions.push(`flightId ILIKE $${queryValues.length}`);
      }

    if (hotelId !== undefined) {
      queryValues.push(`%${hotelId}%`);
      whereExpressions.push(`hotelId ILIKE $${queryValues.length}`);
    }

    if (carId !== undefined) {
        queryValues.push(`%${carId}%`);
        whereExpressions.push(`carId ILIKE $${queryValues.length}`);
      }

    if (whereExpressions.length > 0) {
      query += " WHERE " + whereExpressions.join(" AND ");
    }

    // Finalize query and return results

    query += " ORDER BY tripName";
    const tripsRes = await db.query(query, queryValues);
    return tripsRes.rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle, company }
   *   where company is { handle, name, description, numEmployees, logoUrl }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const tripsRes = await db.query(
     `SELECT id, 
             trip_name AS "tripName",
             trip_date AS "tripDate",
             username,
             flightReservation_id AS "flightId",
             hotelReservation_id AS "hotelId",
             carRental_id AS "carId"
      FROM trips
      WHERE id = $1`, [id]);

    const trip = tripsRes.rows[0];

    if (!trip) throw new NotFoundError(`No found trip: ${id}`);

    return trip;
  }

  /** Update flight data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      tripName: "trip_name",
      tripDate: "trip_date",
    });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE trips
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING 
                      id, 
                      trip_name AS "tripName",
                      trip_date AS "tripDate",
                      username,
                      flightReservation_id AS "flightId",
                      hotelReservation_id AS "hotelId",
                      carRental_id AS "carId"`;
    const result = await db.query(querySql, [...values, id]);
    const trip = result.rows[0];

    if (!trip) throw new NotFoundError(`No found trip: ${id}`);
    return trip;
  }

//    Delete trip from database; returns undefined.

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM trips
           WHERE id = $1
           RETURNING id`, [id]);
    const trip = result.rows[0];
    if (!trip) throw new NotFoundError(`No found trip: ${id}`);
  }

  // Add / remove Flight 
  static async addingFlight(id, username, flightId) {
    const preCheck = await db.query(
          `SELECT id
           FROM flightReservations
           WHERE id = $1`, [flightId]);
    const flight = preCheck.rows[0];
    if (!flight) throw new NotFoundError(`No flight: ${flightId}`);

    const preCheck2 = await db.query(
          `SELECT id
           FROM trips
           WHERE id = $1`, [id]);
    const trip = preCheck2.rows[0];
    if (!trip) throw new NotFoundError(`No trip found: ${id}`);

    const preCheck3 = await db.query(
      `SELECT username
       FROM users
       WHERE username = $1`, [username]);
  const user = preCheck3.rows[0];
  if (!user) throw new NotFoundError(`No username: ${username}`);

    await db.query(
          `INSERT INTO trips (trip_id, username, flightReservation_id)
          VALUES ($1, $2, $3)`,
          [id, username, flightId]);
  }

  static async removeFlight(id, username, flightId) {
    const preCheck = await db.query(
        `SELECT id
         FROM flightReservations
         WHERE id = $1`, [flightId]);
    const flight = preCheck.rows[0];
    if (!flight) throw new NotFoundError(`No flight: ${flightId}`);

    const preCheck2 = await db.query(
      `SELECT id
       FROM trips
       WHERE id = $1`, [id]);
    const trip = preCheck2.rows[0];
    if (!trip) throw new NotFoundError(`No trip found: ${id}`);

    const preCheck3 = await db.query(
        `SELECT username
         FROM users
         WHERE username = $1`, [username]);
    const user = preCheck3.rows[0];
    if (!user) throw new NotFoundError(`No username: ${username}`);

    const preCheck4 = await db.query(
        `SELECT id, flightReservation_id 
         FROM trips
         WHERE id = $1,
               username = $2 and 
               flightReservation_id = $3`, [id, username, flightId]);
    const trips = preCheck4.rows[0];
    if (!trips) throw new NotFoundError(`No trips with flight found: ${id}, ${flightId}`);

    await db.query(
        `DELETE FROM trips 
         WHERE id = $1,
         username = $2 and 
               flightReservation_id = $3`, [id, username, flightId]);
    return true;
  }

  // Add / remove hotel
  static async addingHotel(id, username, hotelId) {
    const preCheck = await db.query(
          `SELECT id
           FROM hotelReservations
           WHERE id = $1`, [hotelId]);
    const hotel = preCheck.rows[0];
    if (!hotel) throw new NotFoundError(`No flight: ${hotelId}`);

    const preCheck2 = await db.query(
          `SELECT id
           FROM trips
           WHERE id = $1`, [id]);
    const trip = preCheck2.rows[0];
    if (!trip) throw new NotFoundError(`No trip found: ${id}`);

    const preCheck3 = await db.query(
      `SELECT username
       FROM users
       WHERE username = $1`, [username]);
  const user = preCheck3.rows[0];
  if (!user) throw new NotFoundError(`No username: ${username}`);

    await db.query(
          `INSERT INTO trips (trip_id, username, hotelReservation_id)
          VALUES ($1, $2, $3)`,
          [id, username, hotelId]);
  }

  static async removeHotel(id, username, hotelId) {
    const preCheck = await db.query(
        `SELECT id
         FROM hotelReservations
         WHERE id = $1`, [hotelId]);
    const hotel = preCheck.rows[0];
    if (!hotel) throw new NotFoundError(`No flight: ${hotelId}`);

    const preCheck2 = await db.query(
      `SELECT id
       FROM trips
       WHERE id = $1`, [id]);
    const trip = preCheck2.rows[0];
    if (!trip) throw new NotFoundError(`No trip found: ${id}`);

    const preCheck3 = await db.query(
        `SELECT username
         FROM users
         WHERE username = $1`, [username]);
    const user = preCheck3.rows[0];
    if (!user) throw new NotFoundError(`No username: ${username}`);

    const preCheck4 = await db.query(
        `SELECT id, hotelReservation_id
         FROM trips
         WHERE id = $1,
               username = $2 and 
               hotelReservation_id = $3`, [id, username, hotelId]);
    const trips = preCheck4.rows[0];
    if (!trips) throw new NotFoundError(`No trips with hotel found: ${id}, ${hotelId}`);

    await db.query(
        `DELETE FROM trips 
         WHERE id = $1,
               username = $2 and 
               hotelReservation_id = $3`, [id, username, hotelId]);
    return true;
  }

  // Add / remove Car
  static async addingCar(id, username, carId) {
    const preCheck = await db.query(
          `SELECT id
           FROM carRentals
           WHERE id = $1`, [carId]);
    const car = preCheck.rows[0];
    if (!car) throw new NotFoundError(`No flight: ${carId}`);

    const preCheck2 = await db.query(
          `SELECT id
           FROM trips
           WHERE id = $1`, [id]);
    const trip = preCheck2.rows[0];
    if (!trip) throw new NotFoundError(`No trip found: ${id}`);

    const preCheck3 = await db.query(
      `SELECT username
       FROM users
       WHERE username = $1`, [username]);
  const user = preCheck3.rows[0];
  if (!user) throw new NotFoundError(`No username: ${username}`);

    await db.query(
          `INSERT INTO trips (trip_id, username, carRental_id)
          VALUES ($1, $2, $3)`,
          [id, username, carId]);
  }

  static async removeCar(id, username, carId) {
    const preCheck = await db.query(
        `SELECT id
         FROM carRentals
         WHERE id = $1`, [carId]);
    const car = preCheck.rows[0];
    if (!car) throw new NotFoundError(`No flight: ${carId}`);

    const preCheck2 = await db.query(
      `SELECT id
       FROM trips
       WHERE id = $1`, [id]);
    const trip = preCheck2.rows[0];
    if (!trip) throw new NotFoundError(`No trip found: ${id}`);

    const preCheck3 = await db.query(
        `SELECT username
         FROM users
         WHERE username = $1`, [username]);
    const user = preCheck3.rows[0];
    if (!user) throw new NotFoundError(`No username: ${username}`);

    const preCheck4 = await db.query(
        `SELECT id, carRental_id
         FROM trips
         WHERE id = $1,
               username = $2 and 
               carRental_id = $3`, [id, username, carId]);
    const trips = preCheck4.rows[0];
    if (!trips) throw new NotFoundError(`No trips with car rent found: ${id}, ${carId}`);

    await db.query(
        `DELETE FROM trips 
         WHERE id = $1,
               username = $2 and 
               carRental_id = $3`, [id, username, carId]);
    return true;
  }


}

module.exports = Trip;
