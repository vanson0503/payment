const express = require('express');
const stripe = require('stripe')('sk_test_51PBIYF08bUcYa2HA2w3H7kT5ylRz3BiyzA2lhazM6a20YibswW1OZDBvBDGCCKhFZeea1iGUZRbEx6KHIU9SUqsD00KkmGmYE6');
const path = require('path');

const app = express();

app.use(express.json());

app.use(express.static('public'));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
    res.setHeader("Permissions-Policy", "attribution-reporting=(self)");
});

app.get('/cancel', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'cancel.html'));
  res.setHeader("Permissions-Policy", "attribution-reporting=(self)");
});

app.get('/success', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'success.html'));
  res.setHeader("Permissions-Policy", "attribution-reporting=(self)");
});


app.post('/payment-sheet', async (req, res) => {
  const customer = await stripe.customers.create();
  const ephemeralKey = await stripe.ephemeralKeys.create(
    {customer: customer.id},
    {apiVersion: '2024-04-10'}
  );
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 1099,
    currency: 'vnd',
    customer: customer.id,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.json({
    paymentIntent: paymentIntent.client_secret,
    ephemeralKey: ephemeralKey.secret,
    customer: customer.id,
    publishableKey: 'pk_test_51PBIYF08bUcYa2HAwT6RAlyMVQ0Va2uI9VuQJEzPXze7M35Rxq4AfNYKYXzZezMIBMY0Uzf77NDrie8U2dT8kPaw00duToWL8Y'
  });
});


app.post('/create-checkout-session', async (req, res) => {
  const id = req.body.id; 
  if (!id) {
      return res.status(400).send("Id order is required");
  }

  const price = req.body.price;
  if (!price) {
      return res.status(400).send("Price is required");
  }

  const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
          price_data: {
              currency: 'vnd',
              product_data: {
                  name: 'Payment',
              },
              unit_amount: price,
          },
          quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.origin}/success?id=${id}&price=${price}`,
      cancel_url: `${req.headers.origin}/cancel?id=${id}&price=${price}`,
  });

  res.json({ sessionId: session.id });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
