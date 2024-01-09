const express = require('express');
const app = express();
const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const PORT = process.env.PORT || 4000;
let catalog = [];
let orderData = [];

const catalogCsvWriter = createCsvWriter({
    path: 'catalog.csv',
    header: [
        { id: 'id', title: 'id' },
        { id: 'price', title: 'price' },
        { id: 'title', title: 'title' },
        { id: 'quantity', title: 'quantity' },
        { id: 'topic', title: 'topic' }
    ]
});

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
        const orderId = parseInt(row.orderId);
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


async function updateCatalogCSV() {
    try {
        await catalogCsvWriter.writeRecords(catalog);
        console.log('Catalog updated successfully');
    } catch (error) {
        console.error('Error updating catalog:', error);
        throw error;
    }
}

app.get('/CATALOG_WEBSERVICE_IP/catalog', async (req, res) => {
    res.json(catalog);
});

app.get('/CATALOG_WEBSERVICE_IP/find/:itemName', async (req, res) => {
    const name = req.params.itemName;
    let result = [];
    for (const item of catalog) {
        if (item.title === name) {
            result.push(item);
        }
    }
    res.json(result);
});

app.get('/CATALOG_WEBSERVICE_IP/getInfo/:itemNum', async (req, res) => {
    const num = req.params.itemNum;
    let result = [];
    for (const item of catalog) {
        if (item.id === num) {
            result.push(item);
        }
    }
    res.json(result);
});

app.get('/CATALOG_WEBSERVICE_IP/put/dec/:itemNum', async (req, res) => {
    const num = req.params.itemNum;
    let result = [];
    for (const item of catalog) {
        if (item.id === num && item.quantity > 0) {
            item.quantity = parseInt(item.quantity) - 1;
            result.push(item);
        }
    }

    
    try {
        await updateCatalogCSV();
        res.json(result);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

app.get('/CATALOG_WEBSERVICE_IP/put/inc/:itemNum', async (req, res) => {
    const num = req.params.itemNum;
    let result = [];
    for (const item of catalog) {
        if (item.id === num && item.quantity > 0) {
            item.quantity = parseInt(item.quantity) + 1;
            result.push(item);
        }
    }

    
    try {
        await updateCatalogCSV();
        res.json(result);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

app.get('/CATALOG_WEBSERVICE_IP/updatePrice/:itemNum/:newPrice', async (req, res) => {
    const itemNum = req.params.itemNum;
    const newPrice = req.params.newPrice;

    let result = [];
    for (const item of catalog) {
        if (item.id === itemNum) {
            item.price = newPrice;
            result.push(item);
        }
    }

    
    try {
        await updateCatalogCSV();
        res.json(result);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

app.use(express.json());
app.post('/CATALOG_WEBSERVICE_IP/updateCatalog', (req, res) => {
    const receivedData = req.body;
    console.log("receivedData : " + receivedData);
    updateCsvFile(receivedData);
    res.json({ message: 'Data received and CSV file updated successfully on Server B' });
});

function updateCsvFile(data) {
    const item = catalog.find((item) => item.title === data.itemName);

    if (!item) {
        console.log('Item not found');
    }
    if (!fs.existsSync('order.csv')) {
        orderCsvWriter.writeRecords([data]);
    } else {
        orderCsvWriter.writeRecords([data], { header: false });
    }

    console.log('CSV file updated with data:', data);

    if (item) {
        item.quantity--;
        console.log('item quantity', item.quantity);
        updateCatalogCSV();
    }
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
