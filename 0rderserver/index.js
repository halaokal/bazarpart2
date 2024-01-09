const express = require('express');
const app = express();
const http = require('http');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const catalog = [];

const fs = require('fs');
const csv = require('csv-parser');
const axios = require('axios');


const PORT = process.env.PORT || 4000;
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


const catalogServerUrl = 'http://10.0.2.4:4000';


app.get('/CATALOG_WEBSERVICE_IP/buy/:itemID', (req, response) => {
    const itemID = req.params.itemID;
  const item = catalog.find((item) => item.id === itemID);
  console.log("item ="+item);
    if (!item) {
        return response.status(404).send('Item not found');
    }

    const data = [];

   
    http.get( `${catalogServerUrl}/CATALOG_WEBSERVICE_IP/put/${req.params.itemNUM}`, (res) => {
        res.on('data', (chunk) => {
            data.push(chunk);
        });
        console.log("data ="+data);
        res.on('end', () => {
            if (data.toString() === "0") {
                return response.status(404).send("0");
            }

            const order = {
                orderId: orderIdCounter,
                itemName: item.title,
                itemPrice: item.price,
            };
            console.log("0rder ="+order);
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
                   // updateCatalogServer();
                    sendOrderToCatalogServer(order);
                   
                    return response.json(order);
                    
                });


        });
    })
    .on('error', (error) => {
        console.log(error);
    });
});

async function sendOrderToCatalogServer(order) {
    try {
        const catalogServerUrl = 'http://10.0.2.4:4000';
        const catalogUpdateUrl = `${catalogServerUrl}/CATALOG_WEBSERVICE_IP/updateCatalog`;

         axios.post(catalogUpdateUrl, order).then((response) => {
            console.log('data sent t0 catal0g');
            console.log('resp0nse',response.data);
            
        }).catch ((error)=> {
            console.error('Error sending order data to catalog server:', error);
        });

        console.log('Order data sent to catalog server:', order);
    } catch (error) {
        console.error('Error sending order data to catalog server:', error);
    }
}


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
