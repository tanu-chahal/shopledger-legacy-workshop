'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

test('can sell the last sellable A2 Gir Cow Ghee unit', function () {
  const products = [{
    id: 6,
    sku: 'DRY-001',
    name: 'A2 Gir Cow Ghee 500ml',
    stock: 1,
    reserved: 0
  }];

  const result = inventory.check(products, [{ id: 6, qty: 1 }]);

  assert.deepEqual(result, { ok: true });
});

test('can sell the last sellable chilli packet when 3 of 4 are reserved', function () {
  const products = [{
    id: 11,
    sku: 'SPC-001',
    name: 'Byadgi Chilli Powder 500g',
    stock: 4,
    reserved: 3
  }];

  const result = inventory.check(products, [{ id: 11, qty: 1 }]);

  assert.deepEqual(result, { ok: true });
});

test('cannot sell more than the available sellable stock', function () {
  const products = [{ id: 6, sku: 'DRY-001', name: 'A2 Gir Cow Ghee 500ml', stock: 1, reserved: 0 }];

  assert.deepEqual(inventory.check(products, [{ id: 6, qty: 2 }]), {
    ok: false,
    msg: 'A2 Gir Cow Ghee 500ml is out of stock (1 sellable available)'
  });
});

test('cancelling pending order #1007 restores its items to physical stock', function () {
  const products = [
    { id: 6, sku: 'DRY-001', name: 'A2 Gir Cow Ghee 500ml', stock: 3, reserved: 0 },
    { id: 4, sku: 'OIL-001', name: 'Cold-Pressed Sunflower Oil 1L', stock: 24, reserved: 4 }
  ];
  const items = [
    { id: 6, sku: 'DRY-001', name: 'A2 Gir Cow Ghee 500ml', price: 450, qty: 2 },
    { id: 4, sku: 'OIL-001', name: 'Cold-Pressed Sunflower Oil 1L', price: 190, qty: 2 }
  ];

  // Model order placement: committed quantities are deducted from physical stock.
  inventory.reserve(products, items);
  const db = {
    products,
    orders: [{ id: 1007, status: 'pending', paymentMode: 'khata', customerId: 4, items, total: 1407 }]
  };

  assert.deepEqual(products.map(function (product) { return product.stock; }), [1, 22]);
  const result = orders.cancel(db, 1007, 'Cancelled from order history');

  assert.equal(result.ok, true);
  assert.equal(result.order.status, 'cancelled');
  assert.deepEqual(products.map(function (product) { return product.reserved; }), [0, 4]);
  assert.deepEqual(products.map(function (product) { return product.stock; }), [3, 24]);
});
