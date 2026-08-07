const { Server } = require('socket.io');
const Y = require('yjs');
const jwt = require('jsonwebtoken');
const DocumentModel = require('./models/Document');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

class YjsSocketServer {
    constructor(server, db) {
        this.io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        this.db = db;
        this.documents = new Map(); // docId -> Y.Doc
        this.documentModels = new DocumentModel(db);
        this.setup();
    }

    async getDoc(documentId) {
        await this.documentModels.createIndex();

        let docRecord = await this.documentModels.findByDocumentId(documentId);
        
        if (this.documents.has(documentId)) {
            return this.documents.get(documentId);
        }

        const ydoc = new Y.Doc();

        // Apply historical data from the database
        if (docRecord && docRecord.binaryState) {
            try {
                Y.applyUpdate(ydoc, docRecord.binaryState.buffer);
            } catch (err) {
                console.error("Failed to load initial state from DB:", err);
            }
        }

        this.documents.set(documentId, ydoc);

        // Periodically save to MongoDB
        const saveInterval = setInterval(async () => {
            if (this.documents.has(documentId)) {
                const currentDoc = this.documents.get(documentId);
                const state = Y.encodeStateAsUpdate(currentDoc);
                await this.documentModels.saveDocument(documentId, state);
            } else {
                clearInterval(saveInterval);
            }
        }, 5000);

        ydoc.on('destroy', () => {
            clearInterval(saveInterval);
            this.documents.delete(documentId);
        });

        return ydoc;
    }

    setup() {
        // Authenticate the websocket connection via JWT
        this.io.use((socket, next) => {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error: Token missing'));
            }
            jwt.verify(token, JWT_SECRET, (err, decoded) => {
                if (err) {
                    return next(new Error('Authentication error: Invalid token'));
                }
                socket.user = decoded;
                next();
            });
        });

        this.io.on('connection', (socket) => {
            const documentId = socket.handshake.query.documentId || 'default';

            this.getDoc(documentId).then(ydoc => {
                const roomName = `doc-${documentId}`;
                socket.join(roomName);
                
                // 1. Send the full current document state to the new client
                const syncMsg = Y.encodeStateAsUpdate(ydoc);
                socket.emit('sync-update', Buffer.from(syncMsg));

                // 2. Listen for changes from the client and broadcast them to everyone else
                socket.on('sync-update', (update) => {
                    const updateBuffer = Buffer.from(update);
                    try {
                        Y.applyUpdate(ydoc, updateBuffer);
                        socket.to(roomName).emit('sync-update', updateBuffer);
                    } catch (err) {
                        console.error("Failed to apply update:", err);
                    }
                });

                // Listen for cursor movements and broadcast them
                socket.on('awareness-update', (update) => {
                    socket.to(roomName).emit('awareness-update', update);
                });

                // Cleanup when the user leaves
                socket.on('disconnect', () => {
                    const room = this.io.sockets.adapter.rooms.get(roomName);
                    if (!room || room.size === 0) {
                        console.log(`Room ${documentId} is empty. Destroying document.`);
                        if (this.documents.has(documentId)) {
                            this.documents.get(documentId).destroy();
                        }
                    }
                });
            }).catch(err => {
                console.error("Error getting doc for socket:", err.message);
                socket.emit('connect_error', err.message);
                socket.disconnect();
            });
        });
    }
}

module.exports = YjsSocketServer;