import express from "express";
import router from "./router.js";

import cors from 'cors';
import morgan from 'morgan';
import bodyParser from "body-parser";
const app = express();

const port = process.env.PORT || 8002;

app.use(morgan('combined')); 
app.use(cors()); 
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({
        extended: true
    }));
app.use(router);
app.listen(port, () => console.log('Server app listening on port ' + port));