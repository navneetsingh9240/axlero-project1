const express = require('express');
const { MongoClient } = require('mongodb');
const http = require('http');
const authRoutes = require('./routes/auth');
const YjsSocketServer = require('./yjs-socket');

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// Enable CORS for frontend communication
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    }
    next();
});

let db;

async function connectToMongo(retries = 5, delay = 2000) {
    // Your genuine MongoDB Atlas connection string
    const mongoUrl = process.env.MONGO_URI || 'mongodb+srv://Navneet9240:Navneet11@navneetapi.tkt9nvw.mongodb.net/syncspace?appName=navneetapi';
    
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Connecting to MongoDB Atlas...`);
            console.log('Connection attempt ${i+1} of $ {retries}');
            const client = await MongoClient.connect(mongoUrl);
            return client;
        } catch (err) {
            console.error(`MongoDB connection attempt ${i + 1} failed.`);

            if (i === retries - 1) throw err;
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

async function startServer() {
    try {
        const client = await connectToMongo();
        db = client.db();
        console.log(`Successfully connected to MongoDB Atlas!`);

        app.locals.db = db;

        const server = http.createServer(app);
        
        // Initialize the WebSockets and CRDT sync engine
        new YjsSocketServer(server, db);

        // API Routes
        app.use('/api/auth', authRoutes);

        app.get('/api/health', (req, res) => {
            res.status(200).json({ status: 'ok' });
        });

        server.listen(port, () => {
            console.log(`Server listening on port ${port}`);
        });

    } catch (err) {
        console.error('Failed to start server. Please check your Atlas Network Access (IP Whitelist). Error:', err.message);
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}

module.exports = { app, startServer };