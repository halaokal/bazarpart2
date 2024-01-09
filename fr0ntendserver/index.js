const express = require('express');
const app = express();
const http = require('http');
const NodeCache = require('node-cache');
const { performance } = require('perf_hooks');
const PORT = process.env.PORT || 4001;
const catalog = [];
let info = [];
let purchase;


const masterServer = 'http://10.0.2.5:4000'; 
const slaveServers = ['http://10.0.2.4:4000',
    
];

let currentServerIndex = 0;

const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

const cachedRequest = async (url, cacheKey) => {
    const stats = cache.getStats();
    console.log(stats);
    console.log('cacheKey' + cacheKey);
    const cachedData = cache.get(cacheKey);
    console.log('cachedData' + cachedData);
    if (cachedData) {
        console.log('Cache hit:', cacheKey);
        return cachedData;
    }
    const data = await fetchData(url);
    if (data !== '0') {
        cache.set(cacheKey, data);
    }
    return data;
};

const fetchData = (url) => {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve(data);
            });
        }).on('error', (error) => {
            console.error('Error in fetchData:', error);
            reject(error);
        });
    });
};


app.get('/CATALOG_WEBSERVICE_IP/search/:itemName', async (req, response) => {
    
    
    const url = slaveServers[currentServerIndex] + `/CATALOG_WEBSERVICE_IP/find/${req.params.itemName}`;
    try {
        const start = performance.now();
        console.log('req.params.itemName' + req.params.itemName);
        const data = await cachedRequest(url, req.params.itemName);
        if (data === '0') {
            info = 'the book is not found';
        } else {
            info = data;
        }
        console.log('info = ', info);
        response.send(info);

        currentServerIndex = (currentServerIndex + 1) % slaveServers.length;
        const end = performance.now();
        const elapsedTime = end - start;

        console.log('Time taken ', elapsedTime, 'milliseconds');
    } catch (error) {
        console.log(error);
        response.status(500).send('Internal Server Error');
    }
});


app.get('/CATALOG_WEBSERVICE_IP/purchase/:itemNUM', async (req, response) => {
    try {
        const start = performance.now();
        const url = masterServer + `/CATALOG_WEBSERVICE_IP/buy/${req.params.itemNUM}`;
        purchase = await fetchData(url);
        const data = await cachedRequest(url, req.params.itemNUM);
        if (data === '0') {
            info = 'the book is not found';
        } else {
            info = data;
        }
        console.log('info = ', info);
        response.send(info);
        const end = performance.now();
    const elapsedTime = end - start;

    console.log('Time taken ', elapsedTime, 'milliseconds');
    
    } catch (error) {
        console.log(error);
        response.status(500).send('Internal Server Error');
    }

    

});


app.get('/CATALOG_WEBSERVICE_IP/info/:itemNUM', async (req, response) => {
    
    const url = slaveServers[currentServerIndex] + `/CATALOG_WEBSERVICE_IP/getInfo/${req.params.itemNUM}`;
    try {
        const start = performance.now();
        const data = await cachedRequest(url, req.params.itemNUM);
        if (data === '0') {
            info = 'the book is not found';
        } else {
            info = data;
        }
        console.log('info = ', info);
        response.send(info);
        
        currentServerIndex = (currentServerIndex + 1) % slaveServers.length;
        const end = performance.now();
        const elapsedTime = end - start;
    
        console.log('Time taken ', elapsedTime, 'milliseconds');
    } catch (error) {
        console.log(error);
        response.status(500).send('Internal Server Error');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
