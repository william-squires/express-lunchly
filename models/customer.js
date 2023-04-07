"use strict";

/** Customer for Lunchly */

const db = require("../db");
const { BadRequestError } = require("../expressError");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, middleName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.middleName = middleName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  middle_name AS "middleName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  middle_name AS "middleName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
      [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** given search term, return all customers with that name
   * [Customer,...]
   */
  static async getCustomersByName(searchTerm) {
    const results = await db.query(
      `SELECT id,
        first_name AS "firstName",
        middle_name AS "middleName",
        last_name  AS "lastName",
        phone,
        notes
      FROM customers
      WHERE CONCAT(first_name, ' ', middle_name, ' ', last_name) ILIKE $1
        OR CONCAT(first_name, ' ', last_name) ILIKE $1
      ORDER BY last_name, first_name`, [`%${searchTerm}%`]
    );
    return results.rows.map(c => new Customer(c));
  }

  /** returns the 10 customers who have made the most reservations:
   * [Customer, ...]
   */
  static async getBestCustomers() {
    const results = await db.query(
      `SELECT c.id,
      first_name AS "firstName",
      middle_name AS "middleName",
      last_name  AS "lastName",
      phone,
      c.notes
    FROM customers AS c
    INNER JOIN reservations  AS r
      ON c.id = r.customer_id
    GROUP BY c.id
    ORDER BY count(r.id) DESC, first_name, last_name
    LIMIT 10`
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }



  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, middle_name, phone, notes)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
        [this.firstName, this.middleName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 middle_name=$6,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
        this.firstName,
        this.lastName,
        this.phone,
        this.notes,
        this.id,
        this.middleName
      ],
      );
    }
  }


  get firstName() {
    return this._firstName
  }

  /**set first name. throw error if none is given */
  set firstName(name) {
    if (!name) {
      throw new BadRequestError("First name is requried")
    }
    this._firstName = name;
  }

  get lastName() {
    return this._lastName
  }

    /**set last name. throw error if none is given */
  set lastName(name) {
    if (!name) {
      throw new BadRequestError("Last name is requried")
    }
    this._lastName = name;
  }

  /** Returns customer's full name: 'firstName lastName' */
  get fullName() {
    return `${this.firstName} ${this.middleName} ${this.lastName}`;
  }

  // get phone() {
  //   return this._phone;
  // }

  // set phone(phoneNumber) {
  //   if (phoneNumber) {
  //     // make sure it is in a valid format
  //     // (nnn)-nnn-nnnn
  //     if (regex.test(phoneNumber)) {

  //     }
  //     else {
  //       throw BadRequestError("Phone number must be in format (###)-###-####")
  //     }
  //   }
  //   else {
  //     this._phone = "";
  //   }
  // }
}

module.exports = Customer;
