const express = require('express');
const redis = require('redis');
const fetch=require('node-fetch');

const PORT = process.env.PORT || 4200;
const REDIS_PORT = process.env.PORT || 6379;

const client = redis.createClient(REDIS_PORT);

const app = express();

function setResponse(username, repos){
    return `<h2>${username} has ${repos} repos</h2>`
}

async function getData(req,res,next){
    try {
        console.log('Fetching data from SERVER...');

        const { username } = req.params;

        const response = await fetch(`https://api.github.com/users/${username}`);

        const data = await response.json();

        const repos = data.public_repos;

        //set data to redis
        client.setex(username, 3600, repos);

        res.send(setResponse(username, repos));

    } catch (error) {
        console.log(error);
        res.status(500);
    }
}

//middleware cache
function cache(req, res, next){
    const { username } = req.params;

    client.get(username, (err, data) => {
        if(err) throw err;

        if(data!=null){
            console.log('Serving from CACHE.....')
            res.send(setResponse(username,data))
        }else{
            next();
        }
    })
}

app.get('/repos/:username',cache, getData);

app.listen(PORT, () => console.log(`App listening on port ${PORT}`));  