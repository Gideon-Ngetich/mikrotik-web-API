const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const { Routeros } = require('routeros-node');
const cors = require('cors')

const app = express();
const port = 3000;

// Middleware setup
app.use(cors({
  origin: 'http://127.0.0.1:5500',
  credentials: true,
}))
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, './frontend')));

// Session setup
app.use(session({
  secret: 'e3c9a8f0-418a-4a47-b2d7-02950ef00eae', // Replace 'your-secret-key' with your own secret string
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: false, sameSite: 'lax' } // Set to true if using HTTPS
}));

let routeros;

// Login Function
async function login(host, port, username, password) {
  routeros = new Routeros({
    host,
    port: parseInt(port, 10),
    user: username,
    password,
  });

  return routeros.connect();
}

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
  if (req.session.isLoggedIn) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// Route to handle login
app.post('/login', async (req, res) => {
  const { host, port, username, password } = req.body;

  try {
    await login(host, port, username, password);
    req.session.isLoggedIn = true; // Mark the session as logged in
    req.session.host = host;
    req.session.port = port;
    req.session.username = username;
    req.session.password = password;
    res.json({ message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to get IP address information
app.get('/ip/address/print',async (req, res) => {
  try {
    if(!routeros){
      await login(req.session.host,
        req.session.port,
        req.session.username,
        req.session.password);
    }
    const usersHotspot = await routeros.write(['/ip/address/print']);
    res.json(usersHotspot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/ppp/profile/add',  async (req, res) => {
  try {
    if(!routeros){
      await login(req.session.host,
        req.session.port,
        req.session.username,
        req.session.password);
    }
    const {name, localAddress, remoteAddress ,dnsServer, } = req.body;
    console.log('Adding PPP Profile:', name, localAddress, remoteAddress,dnsServer);
    // const profileCommand = '/ppp/profile/add', `=name=${name}`
    const profile = await routeros.write(['/ppp/profile/add', `=name=${name}`, `=local-address=${localAddress}`, `=remote-address=${remoteAddress}`, `=dns-server=${dnsServer}`])
    res.status(200).json(profile)
  } catch(error){
    console.error('PPP Profile Add Error:', error); // Log detailed error
    res.status(500).json({error: error.message})
  }

})

app.get('/ppp/profile/exist-profile', async (req, res) => {
  try{
    if(!routeros){
      await login(res.session.host, res.session.port,res.session.username, res.session.password)
    }
    const existing_profile = await routeros.write(['/ppp/profile/print'])
    res.status(201).json(existing_profile);
  }catch(error){
    res.status(404).json(error)
    console.log({error: message.error})
  }
})
// Additional routes for other configurations can be added here

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
