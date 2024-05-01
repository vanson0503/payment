const express = require('express');
const stripe = require('stripe')('sk_test_51PBIYF08bUcYa2HA2w3H7kT5ylRz3BiyzA2lhazM6a20YibswW1OZDBvBDGCCKhFZeea1iGUZRbEx6KHIU9SUqsD00KkmGmYE6');
const path = require('path');

const app = express();


// Middleware to serve static files
app.use(express.static('public'));

// Alternatively, you can directly send the HTML file in response to the root path
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
  // Create a new Stripe customer
  const customer = await stripe.customers.create();
  const ephemeralKey = await stripe.ephemeralKeys.create(
    {customer: customer.id},
    {apiVersion: '2024-04-10'}
  );
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 1099,
    currency: 'eur',
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
  const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
          price_data: {
              currency: 'usd',
              product_data: {
                  name: 'T-shirt',
              },
              unit_amount: 2000,
          },
          quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.origin}/success`,
      cancel_url: `${req.headers.origin}/cancel`,
  });

  res.json({ sessionId: session.id });
});



// Set the port for the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
