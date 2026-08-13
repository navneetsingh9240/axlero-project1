const { ObjectId } = require('mongodb');

class UserModel {
    constructor(db) {
        this.collection = db.collection('users');
    }

    async createIndex() {
        await this.collection.createIndex({ username: 1 }, { unique: true });
    }

    async findByUsername(username) {
        return await this.collection.findOne({ username });
    }

    async findById(id) {
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }
    async countUsers(){
        return await
    this.collection.countDocuments();
    }

    async createUser(username, passwordHash) {
        const result = await this.collection.insertOne({
            username,
            password: passwordHash,
            createdAt: new Date()
        });
        return result.insertedId;
    }
}

module.exports = UserModel;
