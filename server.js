const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 5000;

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Path to customer.json
const DATA_FILE = path.join(__dirname, 'customer.json');

// ✅ Router setup
const router = express.Router();

// ✅ Get Customer List
router.get('/customers', async (req, res, next) => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const customers = JSON.parse(data);
    res.json(customers);
  } catch (err) {
    console.error('❌ Error reading customer data:', err);
    next({ status: 500, message: 'Failed to read customer data' });
  }
});

// ✅ Add New Customer
router.post('/customers', async (req, res, next) => {
  const { name } = req.body;

  if (!name) {
    return next({ status: 400, message: 'Customer name is required' });
  }

  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const customers = JSON.parse(data);

    if (customers.some(customer => customer.name === name)) {
      return next({ status: 400, message: 'Customer already exists' });
    }

    customers.push({ name });
    await fs.writeFile(DATA_FILE, JSON.stringify(customers, null, 2));

    res.status(201).json({ success: true, customer: { name } });
  } catch (err) {
    console.error('❌ Error adding customer:', err);
    next({ status: 500, message: 'Failed to add customer' });
  }
});

// ✅ Remove Customer
router.delete('/customers/:name', async (req, res, next) => {
  const name = decodeURIComponent(req.params.name);

  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const customers = JSON.parse(data);

    const updatedCustomers = customers.filter(customer => customer.name !== name);

    if (updatedCustomers.length === customers.length) {
      return next({ status: 404, message: `Customer "${name}" not found` });
    }

    await fs.writeFile(DATA_FILE, JSON.stringify(updatedCustomers, null, 2));
    res.json({ success: true, message: `${name} removed successfully` });
  } catch (err) {
    console.error('❌ Error removing customer:', err);
    next({ status: 500, message: 'Failed to delete customer' });
  }
});

// ✅ Attach router to the app
app.use(router);

// ✅ Centralized Error Handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
});

// ✅ Handle Invalid Routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
