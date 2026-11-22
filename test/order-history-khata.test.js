'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const orders = require('../lib/orders');
const ledger = require('../lib/ledger');

test('order history sorts order dates newest calendar date first', function () {
  const db = {
    orders: [
      { id: 1008, date: '15/03/2022' },
      { id: 1001, date: '28/12/2021' },
      { id: 1004, date: '30/01/2022' }
    ]
  };

  const result = orders.list(db, {});

  assert.deepEqual(result.map(function (order) { return order.id; }), [1008, 1004, 1001]);
});

test('date filter excludes orders outside the requested calendar range', function () {
  const db = {
    orders: [
      { id: 1004, date: '30/01/2022' },
      { id: 1006, date: '18/02/2022' },
      { id: 1008, date: '15/03/2022' }
    ]
  };

  const result = orders.list(db, { from: '2022-02-01', to: '2022-02-28' });

  assert.deepEqual(result.map(function (order) { return order.id; }), [1006]);
});

test('string settlement amount is added numerically to Meera Joshi ledger', function () {
  const db = {
    nextSettlementId: 501,
    customers: [{
      id: 1,
      name: 'Meera Joshi',
      openingBalance: 450,
      totalBilled: 1982.01,
      totalSettled: 1200,
      creditLimit: 5000
    }],
    settlements: []
  };

  assert.equal(ledger.listCustomers(db)[0].balance, 1232.01);

  const result = ledger.recordSettlement(db, 1, '500', 'upi', 'Part payment at counter');

  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
});
