"use strict";

/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");
const { BadRequestError, ForbiddenError } = require("../expressError");

/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  /** formatter for startAt */

  getFormattedStartAt() {
    return moment(this.startAt).fromNow();
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
      `SELECT id,
                  customer_id AS "customerId",
                  num_guests AS "numGuests",
                  start_at AS "startAt",
                  notes AS "notes"
           FROM reservations
           WHERE customer_id = $1
           ORDER BY start_at DESC`,
      [customerId],
    );

    return results.rows.map(row => new Reservation(row));
  }


  /** Save this reservation. */
  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations (customer_id, start_at, num_guests, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.customerId, this.startAt, this.numGuests, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE reservations
             SET customer_id=$1,
                 start_at=$2,
                 num_guests=$3,
                 notes=$4
             WHERE id = $5`, [
        this.customerId,
        this.startAt,
        this.numGuests,
        this.notes,
        this.id,
      ],
      );
    }
  }

  set numGuests(numGuests) {
    if (numGuests < 1) {
      throw new BadRequestError("# of Guests must be at least 1");
    }
    this._numGuests = numGuests;
  }

  get numGuests() {
    return this._numGuests;
  }


  get startAt() {
    return this._startAt
  }

  set startAt(date) {
    date = new Date(date);
    if (isNaN(date.getTime())) {
      throw new BadRequestError("Invalid date");
    }
    this._startAt = date;
  }


  get customerId() {
    return this._customerId
  }

  set customerId(id) {
    if (this._customerId) {
      throw new ForbiddenError(`Cannot change customerId: ${this._customerId}!`);
    }
    else {
      this._customerId = id;
    }
  }
}


module.exports = Reservation;
