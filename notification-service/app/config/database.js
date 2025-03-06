import dotenv from 'dotenv';
dotenv.config();

const {
  MONGODB_USERNAME,
  MONGODB_PASSWORD,
  MONGODB_HOST,
  MONGODB_PORT,
  MONGODB_DATABASE
} = process.env;

const url = `mongodb://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DATABASE}?authSource=admin`;

export default {
  url,
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
}; 