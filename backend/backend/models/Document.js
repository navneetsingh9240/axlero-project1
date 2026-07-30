const { ObjectId } = require('mongodb');

class DocumentModel {
    constructor(db) {
        this.collection = db.collection('documents');
    }

    async createIndex() {
        await this.collection.createIndex({ documentId: 1 }, { unique: true });
    }

    async findByDocumentId(documentId) {
        return await this.collection.findOne({ documentId });
    }

    async saveDocument(documentId, binaryState) {
        const result = await this.collection.updateOne(
            { documentId },
            { 
                $set: { 
                    binaryState: binaryState,
                    updatedAt: new Date() 
                },
                $setOnInsert: {
                    createdAt: new Date()
                }
            },
            { upsert: true }
        );
        return result;
    }
}

module.exports = DocumentModel;
