import express from "express";
import router from "./router.js";

import cors from 'cors';
import morgan from 'morgan';
import bodyParser from "body-parser";
const app = express();

const port = process.env.PORT || 8000;

app.use(morgan('combined')); 
app.use(cors()); 
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({
        extended: true
    }));
app.use(router); // Requests processing will be defined in the file router
app.listen(port, () => console.log('Server app listening on port ' + port));