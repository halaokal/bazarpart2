const express = require('express');
const app = express();
const fs = require('fs');
const csv = require('csv-parser');
const PORT = process.env.PORT || 4000;
const catalog = [];
const soldBooks = [];
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

fs.createReadStream('catalog.csv')
    .pipe(csv())
    .on('data', (data) => {
        catalog.push(data);
    }).on('end', () => {
        console.log(catalog);
    }).on('error', (error) => {
        console.error(error);
    });

app.get('/CATALOG_WEBSERVICE_IP/:topic', (req, res) => {
    const topic = req.params.topic;
    let result = [];
    let j = 0;
    for (var i in catalog) {
        if (catalog[i].topic === topic) {
            result[j] = catalog[i];
            j++;
        }
    }
    res.send(result);
})

app.get('/CATALOG_WEBSERVICE_IP/find/:itemName', (req, res) => {
    const name = req.params.itemName;
    // console.log("name = ", name);
    let result = [];
    let j = 0;
    for (var i in catalog) {
        if (catalog[i].title === name) {
            // console.log("catalog[i].title = ", catalog[i].title);
            // console.log("name = ", name);
            result[j] = catalog[i];
        }
    }
    res.send(result);
})

app.get('/CATALOG_WEBSERVICE_IP/getInfo/:itemNum', (req, res) => {
    const num = req.params.itemNum;
    let result = [];
    let j = 0;
    for (var i in catalog) {
        if (catalog[i].id === num) {
            result[j] = catalog[i];
        }
    }
    res.send(result);
})


app.get('/CATALOG_WEBSERVICE_IP/put/dec/:itemNum', (req, res) => {
    const num = req.params.itemNum;
    // console.log("num = ", num);
    let result = [];
    let j = 0;
    for (var i in catalog) {
        if (catalog[i].id === num) {
            if (catalog[i].quantity > 0) {
                catalog[i].quantity = `${(parseInt(catalog[i].quantity) - 1)}`;
                const csvWriter = createCsvWriter({
                    path: 'catalog.csv',
                    header: [
                        { id: 'id', title: 'id' },
                        { id: 'price', title: 'price' },
                        { id: 'title', title: 'title' },
                        { id: 'quantity', title: 'quantity' },
                        { id: 'topic', title: 'topic' }
                    ]
                });
                csvWriter
                    .writeRecords(catalog)
                    .then(() => console.log(''));
            }
            result[j] = catalog[i];
        }
    }
    res.send(result);
})

app.get('/CATALOG_WEBSERVICE_IP/put/inc/:itemNum', (req, res) => {
    const num = req.params.itemNum;
    // console.log("num = ", num);
    let result = [];
    let j = 0;
    for (var i in catalog) {
        if (catalog[i].id === num) {
            if (catalog[i].quantity > 0) {
                catalog[i].quantity = `${(parseInt(catalog[i].quantity) + 1)}`;
                const csvWriter = createCsvWriter({
                    path: 'catalog.csv',
                    header: [
                        { id: 'id', title: 'id' },
                        { id: 'price', title: 'price' },
                        { id: 'title', title: 'title' },
                        { id: 'quantity', title: 'quantity' },
                        { id: 'topic', title: 'topic' }
                    ]
                });
                csvWriter
                    .writeRecords(catalog)
                    .then(() => console.log(''));
            }
            result[j] = catalog[i];
        }
    }
    res.send(result);
})

app.get('/CATALOG_WEBSERVICE_IP/updatePrice/:itemNum/:newPrice', (req, res) => {
    const itemNum = req.params.itemNum;
    const newPrice = req.params.newPrice;
    // console.log("itemNum = ", itemNum);
    let result = [];
    let j = 0;
    for (var i in catalog) {
        if (catalog[i].id === itemNum) {
            catalog[i].price = newPrice;
            const csvWriter = createCsvWriter({
                path: 'catalog.csv',
                header: [
                    { id: 'id', title: 'id' },
                    { id: 'price', title: 'price' },
                    { id: 'title', title: 'title' },
                    { id: 'quantity', title: 'quantity' },
                    { id: 'topic', title: 'topic' }
                ]
            });
            csvWriter
                .writeRecords(catalog)
                .then(() => console.log(''));

            result[j] = catalog[i];
        }
    }
    res.send(result);
})
app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
});