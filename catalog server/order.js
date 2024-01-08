const express = require('express');
const app = express();
const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const http = require('http');

const PORT = process.env.PORT || 4000;
const catalog = [];
const orderCsvWriter = createCsvWriter({
    path: 'order.csv',
    header: [
        { id: 'orderId', title: 'OrderID' },
        { id: 'itemName', title: 'ItemName' },
        { id: 'itemPrice', title: 'ItemPrice' },
    ],
    append: true,
});
let orderIdCounter = 1;

fs.createReadStream('order.csv')
    .pipe(csv())
    .on('data', (row) => {
        const orderId = parseInt(row.id);
        if (!isNaN(orderId) && orderId >= orderIdCounter) {
            orderIdCounter = orderId + 1;
        }
    })
    .on('end', () => {
        console.log('Initial orderIdCounter:', orderIdCounter);
    })
    .on('error', (error) => {
        console.error(error);
    });

fs.createReadStream('catalog.csv')
    .pipe(csv({ columns: true }))
    .on('data', (data) => {
        catalog.push(data);
    })
    .on('end', () => {
        console.log('Catalog:', catalog);
    })
    .on('error', (error) => {
        console.error(error);
    });

app.get('/CATALOG_WEBSERVICE_IP/catalog', (req, response) => {
    return response.json(catalog);
});

app.get('/CATALOG_WEBSERVICE_IP/buy/:itemID', (req, response) => {
    const itemID = req.params.itemID;
    const item = catalog.find((item) => item.id === itemID);

    if (!item) {
        return response.status(404).send('Item not found');
    }

    const data = [];

   
    http.get(`http://localhost:4000/CATALOG_WEBSERVICE_IP/put/${req.params.itemNUM}`, (res) => {
        res.on('data', (chunk) => {
            data.push(chunk);
        });

        res.on('end', () => {
            if (data.toString() === "0") {
                return response.status(404).send("0");
            }

            const order = {
                orderId: orderIdCounter,
                itemName: item.title,
                itemPrice: item.price,
            };
            orderIdCounter++;

            item.quantity--;
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

            orderCsvWriter
                .writeRecords([order])
                .then(() => {
                    console.log('Order placed:', order);
                    return response.json(order);
                });
        });
    })
    .on('error', (error) => {
        console.log(error);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});